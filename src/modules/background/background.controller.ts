import { Body, Controller, Post, StreamableFile } from '@nestjs/common';
import { BackgroundService } from './background.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { RemoveBackgroundDto } from './dto/remove-background.dto';

@ApiTags('Remove Background')
@Controller({
  path: '/remove-background',
  version: '1',
})
export class BackgroundController {
  constructor(private readonly backgroundService: BackgroundService) {}

  @ApiOperation({
    summary:
      'Adds images to the queue to be processed and have their backgrounds removed',
  })
  @Post()
  @FormDataRequest()
  async removeBackground(
    @Body() body: RemoveBackgroundDto,
  ): Promise<StreamableFile> {
    return await this.backgroundService.processImages(body);
  }
}
