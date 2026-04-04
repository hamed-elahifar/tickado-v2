import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { PusherService } from '../../src/modules/common/push-notifications/pusher.service';
import { TicketStatus } from '../../src/modules/ticketing/enums/ticket-status.enum';
import { RolesEnum } from '../../src/modules/auth/enums/roles.enum';

type AppModuleType = typeof import('../../src/app.module');

jest.setTimeout(20000);

describe('TicketController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let userOneId: string;
  let userOneToken: string;
  let userTwoId: string;
  let userTwoToken: string;
  let adminToken: string;

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

  const createUserAndLogin = async (
    payload: {
      name: string;
      phone: string;
    },
    role?: RolesEnum,
  ): Promise<{ id: string; token: string }> => {
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(payload)
      .expect(200);

    if (role) {
      await connection.collection('users').updateOne(
        { phone: payload.phone },
        {
          $set: {
            roles: role,
          },
        },
      );
    }

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

  const createTicket = async (
    token: string,
    data: {
      title: string;
      userId: string;
      description?: string;
    },
  ) => {
    return request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(201);
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
      name: 'Ticket User One',
      phone: '+989123456791',
    });
    userOneId = firstUser.id;
    userOneToken = firstUser.token;

    const secondUser = await createUserAndLogin({
      name: 'Ticket User Two',
      phone: '+989123456792',
    });
    userTwoId = secondUser.id;
    userTwoToken = secondUser.token;

    const adminUser = await createUserAndLogin(
      {
        name: 'Ticket Admin',
        phone: '+989123456793',
      },
      RolesEnum.ADMIN,
    );
    adminToken = adminUser.token;
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }

    if (app) {
      await app.close();
    }
  });

  describe('ticket custom endpoints', () => {
    it('should return tickets for a specific user', async () => {
      await createTicket(userOneToken, {
        title: 'User one ticket',
        userId: userOneId,
      });

      await createTicket(userOneToken, {
        title: 'User two ticket',
        userId: userTwoId,
      });

      const response = await request(app.getHttpServer())
        .get(`/tickets/user/${userOneId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('User one ticket');
      expect(response.body[0].userId).toBe(userOneId);
    });

    it('should update status, assign ticket and append response', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Status and assignment flow',
        userId: userOneId,
        description: 'Initial issue details',
      });

      const ticketId = created.body._id as string;

      const statusResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TicketStatus.IN_PROGRESS })
        .expect(200);

      expect(statusResponse.body.status).toBe(TicketStatus.IN_PROGRESS);

      const assignResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedTo: userTwoId })
        .expect(200);

      expect(assignResponse.body.assignedTo).toBe(userTwoId);

      const responseUpdate = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/responses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'We are investigating this issue.',
          createdBy: 'operator',
          operatorId: userTwoId,
        })
        .expect(201);

      expect(Array.isArray(responseUpdate.body.responses)).toBeTruthy();
      expect(responseUpdate.body.responses).toHaveLength(1);
      expect(responseUpdate.body.responses[0].message).toBe(
        'We are investigating this issue.',
      );
      expect(responseUpdate.body.responses[0].createdBy).toBe('operator');
      expect(responseUpdate.body.responses[0].operatorId).toBe(userTwoId);
    });

    it('should delete ticket by id', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Delete me',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200)
        .expect({ deleted: true });

      await request(app.getHttpServer())
        .get(`/tickets/user/${userOneId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBeTruthy();
          expect(response.body).toHaveLength(0);
        });

      await request(app.getHttpServer())
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .expect(404);
    });

    it('should allow admin to delete another user ticket', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Admin deletes this',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect({ deleted: true });
    });

    it('should deny deleting ticket for non-owner non-admin user', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Only owner/admin can delete',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userTwoToken}`)
        .expect(403);
    });

    it('should deny status and assignment update for non-admin users', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Protected ticket operations',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .send({ status: TicketStatus.RESOLVED })
        .expect(401);

      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .send({ assignedTo: userTwoId })
        .expect(401);
    });

    it('should allow owner to add user response and deny non-owner', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Response access control',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/responses`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .send({
          message: 'Owner user response',
          createdBy: 'user',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/responses`)
        .set('Authorization', `Bearer ${userTwoToken}`)
        .send({
          message: 'Not allowed responder',
          createdBy: 'user',
        })
        .expect(403);
    });

    it('should deny operator response for non-admin users', async () => {
      const created = await createTicket(userOneToken, {
        title: 'Operator response restriction',
        userId: userOneId,
      });

      const ticketId = created.body._id as string;

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/responses`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .send({
          message: 'Trying operator response as user',
          createdBy: 'operator',
          operatorId: userOneId,
        })
        .expect(403);
    });
  });
});
