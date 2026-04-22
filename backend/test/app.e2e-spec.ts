import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  closeTestApp,
  clearDatabase,
  TestApp,
} from './test-utils';

describe('AppController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  beforeEach(async () => {
    await clearDatabase(testApp.prisma);
  });

  describe('/ (GET)', () => {
    it('should return Hello World!', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });
  });

  describe('/docs (GET)', () => {
    it('should return swagger documentation', () => {
      return request(app.getHttpServer()).get('/docs').expect(301); // Redirects to /docs/
    });
  });
});
