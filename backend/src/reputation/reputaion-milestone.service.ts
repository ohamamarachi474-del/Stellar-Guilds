// reputation-milestone.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';

const MILESTONES = [100, 500, 1000, 5000];

// ─── Event payload ────────────────────────────────────────────────────────────
export class ReputationUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly newTotal: number,
  ) {}
}

// ─── Mock DB ─────────────────────────────────────────────────────────────────
// Tracks which milestones have already been notified per user
const notifiedMilestones = new Map<string, Set<number>>();

async function hasNotified(userId: string, milestone: number): Promise<boolean> {
  return notifiedMilestones.get(userId)?.has(milestone) ?? false;
}

async function recordNotification(userId: string, milestone: number): Promise<void> {
  if (!notifiedMilestones.has(userId)) notifiedMilestones.set(userId, new Set());
  notifiedMilestones.get(userId)!.add(milestone);
}

// ─── Service ─────────────────────────────────────────────────────────────────
@Injectable()
export class ReputationMilestoneService {
  private readonly logger = new Logger(ReputationMilestoneService.name);

  @OnEvent('REPUTATION_UPDATED')
  async handleReputationUpdated(event: ReputationUpdatedEvent): Promise<void> {
    const { userId, newTotal } = event;

    for (const milestone of MILESTONES) {
      if (newTotal >= milestone && !(await hasNotified(userId, milestone))) {
        await recordNotification(userId, milestone);
        this.logger.log(`Trigger Milestone Notification — user=${userId} milestone=${milestone} xp`);
        // swap log line above for real email/WebSocket call in production
      }
    }
  }
}

// ─── How to emit from another service ────────────────────────────────────────
// constructor(private events: EventEmitter2) {}
// this.events.emit('REPUTATION_UPDATED', new ReputationUpdatedEvent(userId, newTotal));