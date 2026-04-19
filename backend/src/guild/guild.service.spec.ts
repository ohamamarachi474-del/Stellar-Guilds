import { Test, TestingModule } from '@nestjs/testing';
import { GuildService } from './guild.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { validateAndNormalizeSettings } from './guild.settings';
import { ConflictException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

const mockPrisma = () => ({
  guild: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  guildMembership: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  user: { findUnique: jest.fn() },
});

const mockMailer = () => ({
  sendInviteEmail: jest.fn(),
  sendRevokeEmail: jest.fn(),
});

describe('GuildService (settings integration)', () => {
  let service: GuildService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuildService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: MailerService, useFactory: mockMailer },
        {
          provide: StorageService,
          useValue: { uploadFile: jest.fn(), deleteFile: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<GuildService>(GuildService);
    prisma = module.get(PrismaService);
  });

  it('creates guild with normalized settings', async () => {
    prisma.guild.findUnique.mockResolvedValue(null);
    prisma.guild.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...data, id: 'g1' }),
    );

    const dto: any = {
      name: 'Test Guild',
      settings: { visibility: 'private' },
    };
    const res = await service.createGuild(dto, 'owner1');
    expect(prisma.guild.findUnique).toHaveBeenCalled();
    expect(prisma.guild.create).toHaveBeenCalled();
    expect(res.settings.visibility).toBe('private');
    expect(res.id).toBe('g1');
  });

  it('throws conflict when slug exists', async () => {
    prisma.guild.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.createGuild({ name: 'X', slug: 'existing' }, 'owner'),
    ).rejects.toThrow(ConflictException);
  });

  it('merges settings on update', async () => {
    const guildId = 'g-1';
    prisma.guild.findUnique.mockResolvedValue({
      id: guildId,
      settings: { visibility: 'public', requireApproval: false },
    });
    prisma.guild.update.mockImplementation(({ where, data }: any) =>
      Promise.resolve({ id: where.id, ...data }),
    );
    prisma.guildMembership.findUnique.mockResolvedValue({ role: 'OWNER' });

    const updated = await service.updateGuild(
      guildId,
      { settings: { requireApproval: true } } as any,
      'owner1',
    );
    expect(updated.settings.requireApproval).toBe(true);
  });

  it('searches only discoverable guilds', async () => {
    prisma.guild.findMany.mockResolvedValue([{ id: 'g1', name: 'G1' }]);
    prisma.guild.count.mockResolvedValue(1);

    const res = await service.searchGuilds('G', 0, 10);
    expect(res.items.length).toBe(1);

    const calledWhere = prisma.guild.findMany.mock.calls[0][0].where;
    if (calledWhere.AND) {
      expect(calledWhere.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            settings: { path: ['discoverable'], equals: true },
          }),
        ]),
      );
    } else {
      expect(calledWhere).toEqual(
        expect.objectContaining({
          settings: { path: ['discoverable'], equals: true },
        }),
      );
    }
  });

  it('sorts guilds by TVL when sort=tvl', async () => {
    const mockGuilds = [
      {
        id: 'g1',
        name: 'Guild 1',
        settings: { discoverable: true },
        bounties: [{ rewardAmount: 100 }, { rewardAmount: 200 }],
      },
      {
        id: 'g2',
        name: 'Guild 2',
        settings: { discoverable: true },
        bounties: [{ rewardAmount: 500 }],
      },
      {
        id: 'g3',
        name: 'Guild 3',
        settings: { discoverable: true },
        bounties: [],
      },
    ];

    prisma.guild.findMany.mockResolvedValue(mockGuilds);

    const res = await service.searchGuilds(undefined, 0, 10, 'tvl');

    // Should be sorted by TVL descending: g2 (500), g1 (300), g3 (0)
    expect(res.items.length).toBe(3);
    expect(res.items[0].id).toBe('g2');
    expect(res.items[0].tvl).toBe(500);
    expect(res.items[1].id).toBe('g1');
    expect(res.items[1].tvl).toBe(300);
    expect(res.items[2].id).toBe('g3');
    expect(res.items[2].tvl).toBe(0);
  });

  it('paginates TVL sorted results correctly', async () => {
    const mockGuilds = [
      {
        id: 'g1',
        name: 'Guild 1',
        settings: { discoverable: true },
        bounties: [{ rewardAmount: 100 }],
      },
      {
        id: 'g2',
        name: 'Guild 2',
        settings: { discoverable: true },
        bounties: [{ rewardAmount: 500 }],
      },
      {
        id: 'g3',
        name: 'Guild 3',
        settings: { discoverable: true },
        bounties: [{ rewardAmount: 300 }],
      },
    ];

    prisma.guild.findMany.mockResolvedValue(mockGuilds);

    const res = await service.searchGuilds(undefined, 0, 2, 'tvl');

    // Page 0, size 2: should return g2 (500) and g3 (300)
    expect(res.items.length).toBe(2);
    expect(res.items[0].id).toBe('g2');
    expect(res.items[1].id).toBe('g3');
    expect(res.total).toBe(3);
    expect(res.page).toBe(0);
    expect(res.size).toBe(2);
  });

  it('getGuild includes active member and open bounty counts', async () => {
    const guildData = {
      id: 'guild-1',
      name: 'Test Guild',
      slug: 'test-guild',
      memberships: [],
      _count: {
        memberships: 5,
        bounties: 3,
      },
    };
    prisma.guild.findUnique.mockResolvedValue(guildData);

    const result = await service.getGuild('guild-1');

    expect(prisma.guild.findUnique).toHaveBeenCalledWith({
      where: { id: 'guild-1' },
      include: {
        memberships: { include: { user: true } },
        _count: {
          select: {
            memberships: {
              where: { status: 'APPROVED' },
            },
            bounties: {
              where: { status: 'OPEN' },
            },
          },
        },
      },
    });
    expect(result._count.memberships).toBe(5);
    expect(result._count.bounties).toBe(3);
  });

  it('getBySlug includes active member and open bounty counts', async () => {
    const guildData = {
      id: 'guild-1',
      slug: 'test-guild',
      name: 'Test Guild',
      memberships: [],
      _count: {
        memberships: 8,
        bounties: 2,
      },
    };
    prisma.guild.findUnique.mockResolvedValue(guildData);

    const result = await service.getBySlug('test-guild');

    expect(prisma.guild.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test-guild' },
      include: {
        memberships: { include: { user: true } },
        _count: {
          select: {
            memberships: {
              where: { status: 'APPROVED' },
            },
            bounties: {
              where: { status: 'OPEN' },
            },
          },
        },
      },
    });
    expect(result._count.memberships).toBe(8);
    expect(result._count.bounties).toBe(2);
  });
});
