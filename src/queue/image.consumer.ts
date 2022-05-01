import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueWaiting,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import * as Zip from 'adm-zip';
import { BackgroundService } from '~modules/background/background.service';
import { IJobData } from '~queue/interfaces/IJobData';
import { IJobProgress } from '~queue/interfaces/IJobProgress';
import { FileSystemStoredFile } from 'nestjs-form-data';

@Processor('background-images')
export class ImageConsumer {
  private logger: Logger = new Logger(ImageConsumer.name);

  constructor(
    @InjectQueue('background-images') private backgroundImagesQueue: Queue,
    private readonly backgroundService: BackgroundService,
  ) {}

  /**
   * Used to update the progress on a job, forcing an interface of IJobProgress
   *
   * @param job - An instance of the job we want to save data against
   * @param data - What will be saved against the job
   */
  private async updateProgress(job: Job, data: IJobProgress): Promise<void> {
    await job.progress(data);
  }

  /**
   * Check if a job has been cancelled. We have to get a new copy of the job
   * each time because during our 'onProcessBackground' for example, one it
   * starts to run - the job status doesn't get updated unless we manually
   * re-fetch a new instance
   *
   * @param jobId - The UUID of the job we want to look for
   *
   * @returns a boolean depending on if the job is cancelled or not
   */
  private async checkIfCancelled(jobId: string): Promise<boolean> {
    const job = await this.backgroundImagesQueue.getJob(jobId);
    const progress = await (<IJobProgress>job.progress());
    return progress.status === 'Cancelled';
  }

  /**
   * Is called when a job is added to the queue and waiting to be picked up.
   * We use this to just update the status at the moment
   *
   * @param jobId - The UUID of the job we want to look for
   */
  @OnQueueWaiting()
  async onWaiting(jobId: string): Promise<void> {
    this.logger.log(`${jobId} is waiting to be picked up in the queue`);
    const job = await this.backgroundImagesQueue.getJob(jobId);
    await this.updateProgress(job, {
      status: 'Waiting',
      message: `Waiting to be picked up in the queue`,
      lastUpdated: new Date(),
    });
  }

  /**
   * Is called when there is an issue with the job that causes it to fail.
   * We update the status so the user can see there was an issue.
   *
   * @param job - An instance of the job that failed to process
   * @param error - JS Error object with what went wrong
   */
  @OnQueueFailed()
  async onFailed(job: Job, error: Error): Promise<void> {
    this.logger.warn(`${job.id} failed to process correctly.`);
    this.logger.error(JSON.stringify(error));

    await this.updateProgress(job, {
      status: 'Error',
      message: error.message,
      lastUpdated: new Date(),
    });
  }

  /**
   * Is called when a job has finished processing.
   *
   * @param job - An instance of the job we want to save data against
   * @param result - The return value of the method that processed the job. Will typically be a string, however wanted this to be flexible
   */
  @OnQueueCompleted()
  async onCompleted(job: Job, result: unknown) {
    await this.updateProgress(job, {
      status: 'Completed',
      message: String(result),
      lastUpdated: new Date(),
    });
  }

  /**
   * Is used to process the images that have been uploaded and want the backgrounds
   * removing from them. Once finished it will save the modified images in a .zip
   *
   * @param job - An instance of the job we will be processing
   *
   * @returns the message that will be used to update the status of the job
   */
  @Process('background')
  async onProcessBackground(
    job: Job<IJobData<FileSystemStoredFile[]>>,
  ): Promise<string> {
    /* Check if this has been cancelled before proceeding */
    if (await this.checkIfCancelled(job.id.toString()))
      return (<IJobProgress>job.progress()).message;

    const zip = new Zip();

    let progress = 0;
    const totalFiles = job.data.data.length;

    await this.updateProgress(job, {
      status: 'In Progress',
      message: `Processed ${progress}/${totalFiles} images`,
      lastUpdated: new Date(),
    });

    for (const item of job.data.data) {
      /* Check if this has been cancelled before proceeding */
      if (await this.checkIfCancelled(job.id.toString()))
        return (<IJobProgress>job.progress()).message;

      progress++;
      this.logger.log(`Processing ${job.id} - ${progress}/${totalFiles}`);
      zip.addFile(
        item.originalName,
        await this.backgroundService.removeBackground(item.path),
      );
      await this.updateProgress(job, {
        status: 'In Progress',
        message: `Processed ${progress}/${totalFiles} images`,
        lastUpdated: new Date(),
      });
    }

    zip.writeZip(`${process.env.TMP_IMAGE_DIRECTORY}/${job.id}.zip`);
    return `${totalFiles} images have finished processing and are ready for download.`;
  }
}
