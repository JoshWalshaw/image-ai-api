import { Module } from '@nestjs/common';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { BullModule } from '@nestjs/bull';
import { BackgroundRemovalConsumer } from '~queue/background-removal.consumer';
import { FacialDetectionService } from '~modules/facial-detection/facial-detection.service';
import { FacialDetectionController } from '~modules/facial-detection/facial-detection.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'background-removal',
    }),
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      fileSystemStoragePath: process.env.TMP_IMAGE_DIRECTORY_FACIAL,
      autoDeleteFile: false,
    }),
  ],
  controllers: [FacialDetectionController],
  providers: [FacialDetectionService, BackgroundRemovalConsumer],
})
export class FacialDetectionModule {}
