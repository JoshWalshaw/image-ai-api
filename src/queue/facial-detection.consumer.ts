import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueWaiting,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { IJobProgress } from '~queue/interfaces/IJobProgress';
import { FacialDetectionService } from '~modules/facial-detection/facial-detection.service';

@Processor('facial-detection')
export class FacialDetectionConsumer {
  private logger: Logger = new Logger(FacialDetectionConsumer.name);

  constructor(
    @InjectQueue('facial-detection') private facialDetectionQueue: Queue,
    private readonly facialDetectionService: FacialDetectionService,
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
    const job = await this.facialDetectionQueue.getJob(jobId);
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
    const job = await this.facialDetectionQueue.getJob(jobId);
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
}
