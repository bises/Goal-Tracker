import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('should return 200 OK with health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return a valid ISO timestamp', async () => {
    const response = await request(app).get('/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });
});
