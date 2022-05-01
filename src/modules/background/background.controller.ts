import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { BackgroundService } from './background.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { RemoveBackgroundDto } from './dto/remove-background.dto';
import { IJobProgress } from '~queue/interfaces/IJobProgress';
import { UploadBackgroundImagesResponseDto } from '~modules/background/dto/responses/upload-background-images.response.dto';

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
  ): Promise<UploadBackgroundImagesResponseDto> {
    return await this.backgroundService.processImages(body);
  }

  @ApiOperation({
    summary:
      'Adds images to the queue to be processed and have their backgrounds removed',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The id provided by the POST /remove-background endpoint',
  })
  @Get('/status/:id')
  async getJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IJobProgress> {
    return await this.backgroundService.getJobProgress(id);
  }

  @ApiOperation({
    summary: 'Removes a job from the queue',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The id provided by the POST /remove-background endpoint',
  })
  @Delete('/status/:id')
  async cancelJob(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IJobProgress> {
    return await this.backgroundService.cancelJob(id);
  }
}
