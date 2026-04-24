import { Module } from '@nestjs/common';
import { GuildController } from './guild.controller';
import { GuildService } from './guild.service';
import { GuildBulkInviteService } from './guild-bulk-invite.service';
import { ApplicationService } from './application.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, MailerModule, StorageModule],
  controllers: [GuildController],
  providers: [GuildService, GuildBulkInviteService, ApplicationService],
  exports: [GuildService, ApplicationService],
})
export class GuildModule {}

