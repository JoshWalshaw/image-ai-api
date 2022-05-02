import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { v4 as uuid } from 'uuid';

/* Wasn't able to get this to work with imports */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tfjs = require('@tensorflow/tfjs');

@Injectable()
export class FacialDetectionService {
  private logger: Logger = new Logger(FacialDetectionService.name);

  constructor(
    @InjectQueue('facial-detection') private facialDetectionQueue: Queue,
  ) {}
}
