import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GuildModule } from './guild/guild.module';
import { BountyModule } from './bounty/bounty.module';
import { SocialModule } from './social/social.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';
import { ProxylModule } from './proxyl/proxyl.module';
import { ReputationModule } from './reputation/reputation.module';
import { ErrorReportingModule } from './common/modules/error-reporting.module';
import { RedisService } from './common/services/redis.service';
import { MaintenanceGuard } from './common/guards/maintenance.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 100, // 100 requests per 60 seconds
      },
    ]),
    LoggerModule,
    ErrorReportingModule,
    PrismaModule,
    AuthModule,
    UserModule,
    GuildModule,
    BountyModule,
    SocialModule,
    HealthModule,
    QueueModule,
    ProxylModule,
    ReputationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
  ],
})
export class AppModule {}
