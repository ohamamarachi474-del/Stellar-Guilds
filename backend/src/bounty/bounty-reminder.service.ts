import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

/**
 * Service responsible for sending automated reminders for bounties nearing expiration.
 * Runs every 6 hours to check for OPEN bounties expiring within 20-26 hours.
 */
@Injectable()
export class BountyReminderService {
  private readonly logger = new Logger(BountyReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Cron job that runs every 6 hours to check for expiring bounties
   * and send reminder emails to guild admins/creators.
   */
  @Cron('0 */6 * * *')
  async handleBountyReminders(): Promise<void> {
    const now = new Date();
    const twentyHoursFromNow = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const twentySixHoursFromNow = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    this.logger.log('Checking for expiring bounties...');
    this.logger.debug(
      `Time window: ${twentyHoursFromNow.toISOString()} to ${twentySixHoursFromNow.toISOString()}`,
    );

    try {
      const expiringBounties = await this.prisma.bounty.findMany({
        where: {
          status: 'OPEN',
          reminderSent: false,
          deadline: {
            gte: twentyHoursFromNow,
            lte: twentySixHoursFromNow,
          },
        },
        include: {
          guild: {
            include: {
              owner: true,
            },
          },
          creator: true,
        },
      });

      this.logger.log(
        `Found ${expiringBounties.length} bounties nearing expiration`,
      );

      for (const bounty of expiringBounties) {
        await this.processBountyReminder(bounty);
      }
    } catch (error) {
      this.logger.error(
        'Error processing bounty reminders:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Process a single bounty reminder - send email and mark as reminded
   */
  private async processBountyReminder(bounty: {
    id: string;
    title: string;
    deadline: Date | null;
    guild: { owner: { email: string } | null } | null;
    creator: { email: string } | null;
  }): Promise<void> {
    // Determine admin email: guild owner first, then creator
    const adminEmail = bounty.guild?.owner?.email || bounty.creator?.email;

    if (!adminEmail) {
      this.logger.warn(`No admin email found for bounty ${bounty.id}`);
      return;
    }

    if (!bounty.deadline) {
      this.logger.warn(
        `Bounty ${bounty.id} has no deadline, skipping reminder`,
      );
      return;
    }

    try {
      await this.mailer.sendBountyReminderEmail(
        adminEmail,
        bounty.title,
        bounty.deadline,
        bounty.id,
      );

      // Mark bounty as reminded to prevent duplicate emails
      await this.prisma.bounty.update({
        where: { id: bounty.id },
        data: { reminderSent: true },
      });

      this.logger.log(`Reminder sent for bounty ${bounty.id} to ${adminEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder for bounty ${bounty.id}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
