import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

/**
 * E2E tests require running PostGIS and Redis.
 * Run: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
 * Then: cd apps/api && npm run test:e2e
 */
describe('App (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.payload)).toEqual(
      expect.objectContaining({ status: 'ok' }),
    );
  });

  it('/api/auth/login (POST) should reject invalid credentials', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'noone@hdbank.com', password: 'wrong' },
    });
    expect(result.statusCode).toBe(401);
  });

  it('/api/users (GET) should require auth', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/api/users',
    });
    expect(result.statusCode).toBe(401);
  });

  it('/api/attendance/check-in (POST) should require auth', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/api/attendance/check-in',
      payload: { latitude: 10.77, longitude: 106.70, deviceId: 'test' },
    });
    expect(result.statusCode).toBe(401);
  });
});
