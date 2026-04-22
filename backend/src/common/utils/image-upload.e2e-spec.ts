import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Image Upload Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testUser: any;
  let testGuild: any;
  let authToken: string;

  const createTestImage = (mimeType: string) => {
    // Create a small valid PNG image
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    return {
      buffer,
      originalname: `test.${mimeType.split('/')[1]}`,
      mimetype: mimeType,
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-upload@example.com',
        username: 'testuploader',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Uploader',
      },
    });

    // Create test guild
    testGuild = await prisma.guild.create({
      data: {
        name: 'Test Guild',
        slug: 'test-guild-upload',
        description: 'A test guild',
        ownerId: testUser.id,
      },
    });

    // Create membership
    await prisma.guildMembership.create({
      data: {
        userId: testUser.id,
        guildId: testGuild.id,
        role: 'OWNER',
        status: 'APPROVED',
      },
    });

    // Generate JWT token
    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testGuild?.id) {
      await prisma.guildMembership.deleteMany({
        where: { guildId: testGuild.id },
      });
      await prisma.guild.delete({ where: { id: testGuild.id } });
    }
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    await app.close();
  });

  describe('POST /users/me/avatar', () => {
    it('should upload avatar with valid PNG file', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.avatarUrl).toBeDefined();
          expect(res.body.data.message).toBe('Avatar updated successfully');
        });
    });

    it('should upload avatar with valid JPEG file', () => {
      const image = createTestImage('image/jpeg');

      return request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(200);
    });

    it('should upload avatar with valid WebP file', () => {
      const image = createTestImage('image/webp');

      return request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(200);
    });

    it('should reject avatar upload without authentication', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post('/users/me/avatar')
        .attach('file', image.buffer, image.originalname)
        .expect(401);
    });

    it('should reject GIF file type', () => {
      const gifBuffer = Buffer.from('GIF89a');

      return request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', gifBuffer, 'test.gif')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'File must be one of the following types',
          );
        });
    });
  });

  describe('POST /guilds/:id/logo', () => {
    it('should upload logo with valid PNG file', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post(`/guilds/${testGuild.id}/logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.logoUrl).toBeDefined();
          expect(res.body.data.message).toBe('Guild logo updated successfully');
        });
    });

    it('should reject logo upload without authentication', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post(`/guilds/${testGuild.id}/logo`)
        .attach('file', image.buffer, image.originalname)
        .expect(401);
    });

    it('should reject logo upload for non-existent guild', () => {
      const image = createTestImage('image/png');
      const fakeId = 'non-existent-id';

      return request(app.getHttpServer())
        .post(`/guilds/${fakeId}/logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(404);
    });
  });

  describe('POST /guilds/:id/banner', () => {
    it('should upload banner with valid PNG file', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post(`/guilds/${testGuild.id}/banner`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', image.buffer, image.originalname)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.bannerUrl).toBeDefined();
          expect(res.body.data.message).toBe(
            'Guild banner updated successfully',
          );
        });
    });

    it('should reject banner upload without authentication', () => {
      const image = createTestImage('image/png');

      return request(app.getHttpServer())
        .post(`/guilds/${testGuild.id}/banner`)
        .attach('file', image.buffer, image.originalname)
        .expect(401);
    });
  });
});
