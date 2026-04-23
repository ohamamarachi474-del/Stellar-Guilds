import { Module } from '@nestjs/common';
import { ProxylService } from './proxyl.service';
import { ImageProxyController } from './proxyl.controller';

@Module({
  controllers: [ImageProxyController],
  providers: [ProxylService],
})
export class ProxylModule {}
