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
      'Attempts to remove the background from a picture with a person in',
  })
  @Post()
  @FormDataRequest()
  async removeBackground(
    @Body() body: RemoveBackgroundDto,
  ): Promise<StreamableFile> {
    return await this.backgroundService.processImages(body);
  }
}
