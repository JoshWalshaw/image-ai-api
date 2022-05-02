import {
  Body,
  Controller,
  Response,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { BackgroundRemovalService } from './background-removal.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { RemoveBackgroundDto } from './dto/remove-background.dto';
import { IJobProgress } from '~queue/interfaces/IJobProgress';
import { UploadBackgroundImagesResponseDto } from '~modules/background-removal/dto/responses/upload-background-images.response.dto';

@ApiTags('Remove Background')
@Controller({
  path: '/remove-background',
  version: '1',
})
export class BackgroundRemovalController {
  constructor(
    private readonly backgroundRemovalService: BackgroundRemovalService,
  ) {}

  @ApiOperation({
    summary:
      'Adds images to the queue to be processed and have their backgrounds removed',
  })
  @Post()
  @FormDataRequest()
  async removeBackground(
    @Body() body: RemoveBackgroundDto,
  ): Promise<UploadBackgroundImagesResponseDto> {
    return await this.backgroundRemovalService.addImagesToQueue(body);
  }

  @ApiOperation({
    summary: 'Downloads the processed results',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The id provided by the POST /remove-background endpoint',
  })
  @Get('/:id')
  async downloadImages(
    @Response({ passthrough: true }) res,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    // TODO: See if there's a better way to do this
    const file = await this.backgroundRemovalService.downloadFiles(id);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${id}.zip"`,
    });
    return file;
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
    return await this.backgroundRemovalService.getJobProgress(id);
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
    return await this.backgroundRemovalService.cancelJob(id);
  }
}
