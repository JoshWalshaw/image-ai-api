import { Module } from '@nestjs/common';
import { BackgroundRemovalController } from './background-removal.controller';
import { BackgroundRemovalService } from './background-removal.service';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { BullModule } from '@nestjs/bull';
import { ImageConsumer } from '~queue/image.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'background-images',
    }),
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      fileSystemStoragePath: process.env.TMP_IMAGE_DIRECTORY_BACKGROUND,
      autoDeleteFile: false,
    }),
  ],
  controllers: [BackgroundRemovalController],
  providers: [BackgroundRemovalService, ImageConsumer],
})
export class BackgroundRemovalModule {}
