import { FileSystemStoredFile } from 'nestjs-form-data';

export interface IBackgroundImageJob {
  id: string;
  files: FileSystemStoredFile[];
}
