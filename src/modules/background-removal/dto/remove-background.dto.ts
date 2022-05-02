import {
  FileSystemStoredFile,
  HasMimeType,
  IsFiles,
  MaxFileSize,
} from 'nestjs-form-data';

export class RemoveBackgroundDto {
  @IsFiles()
  @MaxFileSize(1.5e7, { each: true }) // 15MB
  @HasMimeType(['image/jpeg', 'image/png'], { each: true })
  files: FileSystemStoredFile[];
}
