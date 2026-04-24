import { Controller, Get, Version } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  @Version('1')
  getV1() {
    return { version: 'v1', status: 'ok' };
  }
}
