import { Module } from '@nestjs/common';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';
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
      fileSystemStoragePath: process.env.TMP_IMAGE_DIRECTORY,
      autoDeleteFile: false,
    }),
  ],
  controllers: [BackgroundController],
  providers: [BackgroundService, ImageConsumer],
})
export class BackgroundModule {}
