import { Injectable } from '@nestjs/common';
import { CreateReputationDto } from './dto/create-reputation.dto';
import { UpdateReputationDto } from './dto/update-reputation.dto';

// Mock reputation event shape
interface ReputationEvent {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: Date;
}

// Generate 100 mock events for a given userId
function mockEvents(userId: string): ReputationEvent[] {
  return Array.from({ length: 100 }, (_, i) => ({
    id: `evt-${i + 1}`,
    userId,
    points: Math.floor(Math.random() * 50) + 1,
    reason: `Task #${i + 1} completed`,
    createdAt: new Date(Date.now() - i * 3_600_000), // descending by 1h
  }));
}

@Injectable()
export class ReputationService {
  create(createReputationDto: CreateReputationDto) {
    return 'This action adds a new reputation';
  }

  findAll() {
    return `This action returns all reputation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reputation`;
  }

  update(id: number, updateReputationDto: UpdateReputationDto) {
    return `This action updates a #${id} reputation`;
  }

  remove(id: number) {
    return `This action removes a #${id} reputation`;
  }

  /**
   * Cursor-based pagination over mock reputation events.
   * Events are ordered descending by createdAt (index on userId + createdAt).
   */
  getReputationHistory(
    userId: string,
    limit = 20,
    cursor?: string,
  ): { data: ReputationEvent[]; nextCursor: string | null; hasMore: boolean } {
    const all = mockEvents(userId); // already desc by createdAt

    let startIndex = 0;
    if (cursor) {
      const idx = all.findIndex((e) => e.id === cursor);
      startIndex = idx === -1 ? 0 : idx + 1;
    }

    const slice = all.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < all.length;

    return {
      data: slice,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
      hasMore,
    };
  }
}
