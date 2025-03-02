import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    // Create a test user
    const testUser = await userRepository.save({
      email: 'test@example.com',
      password: 'hashed_password', // In a real test, you would hash this
      name: 'Test User',
      role: 'user',
    });

    testUserId = testUser.id;

    // Generate JWT token for the test user
    authToken = jwtService.sign({ 
      sub: testUser.id,
      email: testUser.email,
      role: testUser.role
    });
  });

  afterAll(async () => {
    // Clean up test user
    await userRepository.delete({ id: testUserId });
    await app.close();
  });

  describe('GET /api/tasks', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/tasks')
        .expect(401);
    });

    it('should return an array of tasks for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', () => {
      const newTask = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'medium',
        due_date: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(newTask.title);
          expect(res.body.description).toBe(newTask.description);
          expect(res.body.status).toBe('pending'); // Default status
          expect(res.body.user_id).toBe(testUserId);
        });
    });

    it('should return 400 for invalid task data', () => {
      const invalidTask = {
        // Missing required title
        description: 'This is an invalid task',
      };

      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task to update
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Update',
          description: 'This task will be updated',
          priority: 'medium',
        });

      taskId = response.body.id;
    });

    it('should update task status', () => {
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('in_progress');
        });
    });

    it('should return 400 for invalid status', () => {
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .patch('/api/tasks/non-existent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task to delete
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete',
          description: 'This task will be deleted',
          priority: 'low',
        });

      taskId = response.body.id;
    });

    it('should delete a task', () => {
      return request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 