import { Module } from '@nestjs/common';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { BullModule } from '@nestjs/bull';
import { FacialDetectionService } from '~modules/facial-detection/facial-detection.service';
import { FacialDetectionController } from '~modules/facial-detection/facial-detection.controller';
import { FacialDetectionConsumer } from '~queue/facial-detection.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'facial-detection',
    }),
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      fileSystemStoragePath: process.env.TMP_IMAGE_DIRECTORY_FACIAL,
      autoDeleteFile: false,
    }),
  ],
  controllers: [FacialDetectionController],
  providers: [FacialDetectionService, FacialDetectionConsumer],
})
export class FacialDetectionModule {}
