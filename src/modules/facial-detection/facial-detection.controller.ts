import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacialDetectionService } from '~modules/facial-detection/facial-detection.service';

@ApiTags('Facial Detection')
@Controller({
  path: '/facial-detection',
  version: '1',
})
export class FacialDetectionController {
  constructor(
    private readonly facialDetectionService: FacialDetectionService,
  ) {}
}
