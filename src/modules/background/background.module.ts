import { Module } from '@nestjs/common';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      fileSystemStoragePath: process.env.TMP_IMAGE_DIRECTORY,
      autoDeleteFile: true,
    }),
  ],
  controllers: [BackgroundController],
  providers: [BackgroundService],
})
export class BackgroundModule {}
