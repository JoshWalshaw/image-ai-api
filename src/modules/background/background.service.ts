import '@tensorflow/tfjs-node';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  PreconditionFailedException,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import { createCanvas, Image } from 'canvas';
import * as BodyPix from '@tensorflow-models/body-pix';
import { RemoveBackgroundDto } from './dto/remove-background.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { v4 as uuid } from 'uuid';
import { IJobData } from '~queue/interfaces/IJobData';
import { FileSystemStoredFile } from 'nestjs-form-data';
import { IJobProgress } from '~queue/interfaces/IJobProgress';
import { UploadBackgroundImagesResponseDto } from '~modules/background/dto/responses/upload-background-images.response.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

/* Wasn't able to get this to work with imports */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tfjs = require('@tensorflow/tfjs');

@Injectable()
export class BackgroundService {
  private logger: Logger = new Logger(BackgroundService.name);

  constructor(
    @InjectQueue('background-images') private backgroundImagesQueue: Queue,
  ) {}

  /**
   * Adds the images to the queue to be processed in the background.
   *
   * @param dto - The request object that was sent to us, containing the files
   *
   * @returns a jobId that can be used to track the status of the images uploaded
   */
  async addImagesToQueue(
    dto: RemoveBackgroundDto,
  ): Promise<UploadBackgroundImagesResponseDto> {
    if (dto.files.length) {
      const jobData: IJobData<FileSystemStoredFile[]> = {
        data: dto.files,
      };

      const jobId = uuid();

      await this.backgroundImagesQueue.add('background', jobData, {
        jobId,
      });

      return { jobId };
    } else throw new BadRequestException();
  }

  async removeBackground(path: string): Promise<Buffer> {
    const image = new Image();
    image.src = path;

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, image.width, image.height);

    const net = await BodyPix.load({
      architecture: 'ResNet50',
      outputStride: 32,
      quantBytes: 1,
    });

    const segmentation = await net.segmentPerson(
      tfjs.browser.fromPixels(canvas),
      {
        internalResolution: 'low',
        segmentationThreshold: 0.7,
        scoreThreshold: 0.7,
      },
    );

    const { data: imgData } = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const newImg = ctx.createImageData(canvas.width, canvas.height);
    const newImgData = newImg.data;

    segmentation.data.forEach((segment, i) => {
      if (segment == 1) {
        newImgData[i * 4] = imgData[i * 4];
        newImgData[i * 4 + 1] = imgData[i * 4 + 1];
        newImgData[i * 4 + 2] = imgData[i * 4 + 2];
        newImgData[i * 4 + 3] = imgData[i * 4 + 3];
      }
    });

    ctx.putImageData(newImg, 0, 0);

    return canvas.toBuffer();
  }

  /**
   * Gets the progress of a job
   *
   * @param id - The job UUID provided by 'addImagesToQueue'
   *
   * @returns the progress of the job
   */
  async getJobProgress(id: string): Promise<IJobProgress> {
    const job = await this.backgroundImagesQueue.getJob(id);
    return <IJobProgress>job.progress();
  }

  /**
   * Sets the status of a job to be Cancelled. Prevents any further action
   * happening on this job. If currently being processed it will stop and move
   * on to the next one.
   *
   * @param id - The job UUID provided by 'addImagesToQueue'
   *
   * @returns the progress of the job, which is now cancelled
   */
  async cancelJob(id: string): Promise<IJobProgress> {
    const jobProgress: IJobProgress = {
      status: 'Cancelled',
      message: 'Job was cancelled by user',
      lastUpdated: new Date(),
    };

    const job = await this.backgroundImagesQueue.getJob(id);
    await job.progress(jobProgress);
    await job.discard();
    return jobProgress;
  }

  /**
   * Sets the status of a job to be Cancelled. Prevents any further action
   * happening on this job. If currently being processed it will stop and move
   * on to the next one.
   *
   * @param id - The job UUID provided by 'addImagesToQueue'
   *
   * @returns the progress of the job, which is now cancelled
   */
  async downloadFiles(id: string): Promise<StreamableFile> {
    const progress = await this.getJobProgress(id);

    if (progress.status === 'Completed') {
      try {
        const file = await fs.readFile(
          path.join(process.env.TMP_IMAGE_DIRECTORY, `${id}.zip`),
        );
        return new StreamableFile(file, {
          type: 'application/zip',
          disposition: `${id}.zip`,
        });
      } catch (error) {
        this.logger.warn('There was an error reading a file: ', id);
        this.logger.error(error);
        throw new ServiceUnavailableException(
          'There was an error reading the file requested.',
        );
      }
    } else {
      throw new PreconditionFailedException(
        "These images haven't finished processing yet. Please try again later.",
      );
    }
  }
}
