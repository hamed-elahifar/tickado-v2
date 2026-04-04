import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { PusherService } from '../../src/modules/common/push-notifications/pusher.service';

jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => jest.fn(() => 'A1B2C3D4')),
}));

type AppModuleType = typeof import('../../src/app.module');

describe('AnswerController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let userOneToken: string;
  let userTwoToken: string;
  let questionnaireId: string;

  const getAccessToken = async (phone: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        phone,
        code: '1234',
      })
      .expect(201);

    return response.body.accessToken;
  };

  const createUserAndLogin = async (payload: {
    name: string;
    phone: string;
  }): Promise<{ id: string; token: string }> => {
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(payload)
      .expect(200);

    const token = await getAccessToken(payload.phone);

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return {
      id: meResponse.body._id,
      token,
    };
  };

  const createQuestionnaire = async (token: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/questionnaires')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Answer E2E Questionnaire',
        description: 'Questionnaire for answer module e2e tests',
        imageUrl: 'https://example.com/cover.jpg',
      })
      .expect(201);

    return response.body._id;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.PORT = process.env.PORT || '3000';
    process.env.CLIENT_PORT = process.env.CLIENT_PORT || '3001';

    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
    process.env.REDIS_TTL = process.env.REDIS_TTL || '60';

    process.env.MONGO_URL =
      process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tickado_test';
    process.env.MONGO_DEBUG = process.env.MONGO_DEBUG || 'false';

    process.env.JWT_SECRET = process.env.JWT_SECRET || '123123';
    process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'tickado';
    process.env.JWT_ISSUER = process.env.JWT_ISSUER || 'tickado-test';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

    process.env.SMS_API_URL = process.env.SMS_API_URL || 'http://localhost';
    process.env.SMS_API_KEY = process.env.SMS_API_KEY || 'test-key';
    process.env.SMS_SENDER = process.env.SMS_SENDER || 'test-sender';

    process.env.PUSHER_APP_ID = process.env.PUSHER_APP_ID || 'test-app-id';
    process.env.PUSHER_KEY = process.env.PUSHER_KEY || 'test-key';
    process.env.PUSHER_SECRET = process.env.PUSHER_SECRET || 'test-secret';
    process.env.PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || 'test-cluster';

    process.env.S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost';
    process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tickado-test';
    process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'test-access-key';
    process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'test-secret-key';

    process.env.NESHAN_API_KEY = process.env.NESHAN_API_KEY || 'test-neshan';

    const { AppModule }: AppModuleType = await import('../../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PusherService)
      .useValue({
        trigger: jest.fn(),
        triggerToUser: jest.fn(),
        triggerToGame: jest.fn(),
        triggerToChannel: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.dropDatabase();

    const firstUser = await createUserAndLogin({
      name: 'Answer User One',
      phone: '+989123456771',
    });
    userOneToken = firstUser.token;

    const secondUser = await createUserAndLogin({
      name: 'Answer User Two',
      phone: '+989123456772',
    });
    userTwoToken = secondUser.token;

    questionnaireId = await createQuestionnaire(userOneToken);
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }

    if (app) {
      await app.close();
    }
  });

  describe('/answers/start/:questionnaireId (POST)', () => {
    it('should create an in-progress answer for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/answers/start/${questionnaireId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.questionnaireId).toBe(questionnaireId);
      expect(response.body.status).toBe('in-progress');
      expect(response.body.userId).toBeDefined();
      expect(response.body.startTime).toBeDefined();
      expect(response.body.finishTime).toBeNull();
    });

    it('should return 400 for invalid questionnaire id', async () => {
      await request(app.getHttpServer())
        .post('/answers/start/not-a-valid-object-id')
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(400);
    });
  });

  describe('answer state operations', () => {
    it('should return 404 when finishing a non-existing in-progress answer', async () => {
      await request(app.getHttpServer())
        .patch(`/answers/finish/${questionnaireId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(404);
    });

    it('should return count of answers for questionnaire', async () => {
      await request(app.getHttpServer())
        .post(`/answers/start/${questionnaireId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/answers/start/${questionnaireId}`)
        .set('Authorization', `Bearer ${userTwoToken}`)
        .expect(200);

      const countResponse = await request(app.getHttpServer())
        .get(`/answers/count/${questionnaireId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200);

      expect(countResponse.body).toEqual({ count: 2 });
    });
  });
});
