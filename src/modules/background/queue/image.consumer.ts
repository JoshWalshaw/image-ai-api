import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as Zip from 'adm-zip';
import { IBackgroundImageJob } from '../interfaces/IBackgroundImageJob';
import { BackgroundService } from '../background.service';

@Processor('background-images')
export class ImageConsumer {
  private logger: Logger = new Logger(ImageConsumer.name);

  constructor(private readonly backgroundService: BackgroundService) {}

  @Process('background')
  async processBackgroundRemoval(job: Job<IBackgroundImageJob>) {
    const zip = new Zip();

    let progress = 0;
    const totalFiles = job.data.files.length;

    for (const item of job.data.files) {
      progress++;
      await job.progress(`${progress}/${totalFiles}`);
      this.logger.log(`Processing ${job.data.id} - ${progress}/${totalFiles} `);
      zip.addFile(
        item.originalName,
        await this.backgroundService.removeBackground(item.path),
      );
    }

    zip.writeZip(`${process.env.TMP_IMAGE_DIRECTORY}/${job.data.id}.zip`);
  }
}
