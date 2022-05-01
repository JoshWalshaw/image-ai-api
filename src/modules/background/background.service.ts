import '@tensorflow/tfjs-node';
import { Injectable, StreamableFile } from '@nestjs/common';
import { createCanvas, Image } from 'canvas';
import * as BodyPix from '@tensorflow-models/body-pix';
import { RemoveBackgroundDto } from './dto/remove-background.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { v4 as uuid } from 'uuid';
import { IBackgroundImageJob } from './interfaces/IBackgroundImageJob';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tfjs = require('@tensorflow/tfjs');

@Injectable()
export class BackgroundService {
  constructor(
    @InjectQueue('background-images') private backgroundImagesQueue: Queue,
  ) {}

  async processImages(dto: RemoveBackgroundDto): Promise<StreamableFile> {
    if (dto.files.length) {
      const jobData: IBackgroundImageJob = {
        id: uuid(),
        files: dto.files,
      };

      await this.backgroundImagesQueue.add('background', jobData);
    }

    return null;
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
}
