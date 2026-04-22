import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';

class QueueDummyJobsDto {
  @ApiProperty({ description: 'Number of jobs to queue', default: 1 })
  count!: number;

  @ApiProperty({ description: 'Base message for jobs', required: false })
  message?: string;
}

class QueueStatsResponse {
  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting!: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active!: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed!: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed!: number;
}

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('dummy')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue dummy jobs for testing' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Jobs queued successfully',
  })
  async queueDummyJobs(@Body() dto: QueueDummyJobsDto): Promise<{
    message: string;
    count: number;
  }> {
    const count = dto.count || 1;
    const baseMessage = dto.message || 'Test job';

    const jobs = Array.from({ length: count }, (_, index) => ({
      message: `${baseMessage} #${index + 1}`,
      priority: Math.floor(Math.random() * 5) + 1,
    }));

    await this.queueService.addDummyJobs(jobs);

    return {
      message: `Successfully queued ${count} dummy jobs`,
      count,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get all queue statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics',
  })
  async getQueueStats(): Promise<Record<string, QueueStatsResponse>> {
    return this.queueService.getAllQueuesStats();
  }

  @Get('stats/:queueName')
  @ApiOperation({ summary: 'Get specific queue statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics',
  })
  async getSpecificQueueStats(
    queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
  ): Promise<QueueStatsResponse> {
    return this.queueService.getQueueStats(queueName);
  }
}
