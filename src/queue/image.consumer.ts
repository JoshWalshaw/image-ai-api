import {
  InjectQueue,
  OnQueueCompleted,
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

  private async updateProgress(job: Job, data: IJobProgress): Promise<void> {
    await job.progress(data);
  }

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

  @OnQueueCompleted()
  async onCompleted(job: Job, result: unknown) {
    await this.updateProgress(job, {
      status: 'Completed',
      message: String(result),
      lastUpdated: new Date(),
    });
  }

  @Process('background')
  async onProcessBackground(
    job: Job<IJobData<FileSystemStoredFile[]>>,
  ): Promise<string> {
    const zip = new Zip();

    let progress = 0;
    const totalFiles = job.data.data.length;

    for (const item of job.data.data) {
      progress++;
      await this.updateProgress(job, {
        status: 'In Progress',
        message: `Processed ${progress}/${totalFiles} images`,
        lastUpdated: new Date(),
      });
      this.logger.log(`Processing ${job.id} - ${progress}/${totalFiles}`);
      zip.addFile(
        item.originalName,
        await this.backgroundService.removeBackground(item.path),
      );
    }

    zip.writeZip(`${process.env.TMP_IMAGE_DIRECTORY}/${job.id}.zip`);
    return `${totalFiles} images have finished processing`;
  }
}
