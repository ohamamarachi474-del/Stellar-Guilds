import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MembershipStatus, GuildRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, guildId: string) {
    const existing = await this.prisma.guildMembership.findFirst({
      where: { userId, guildId, status: MembershipStatus.PENDING },
    });
    if (existing) throw new ConflictException('Pending application already exists');

    return this.prisma.guildMembership.create({
      data: { userId, guildId, status: MembershipStatus.PENDING, role: GuildRole.MEMBER },
    });
  }

  async updateStatus(
    applicationId: string,
    status: MembershipStatus,
    adminId: string,
  ) {
    // Mocked admin check
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    const application = await this.prisma.guildMembership.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== MembershipStatus.PENDING)
      throw new BadRequestException('Only PENDING applications can be updated');
    if (status === MembershipStatus.PENDING)
      throw new BadRequestException('Cannot transition back to PENDING');

    return this.prisma.guildMembership.update({
      where: { id: applicationId },
      data: {
        status,
        ...(status === MembershipStatus.APPROVED ? { joinedAt: new Date() } : {}),
      },
    });
  }
}
