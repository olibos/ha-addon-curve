import request from 'supertest';
import { version } from './package.json';
import app from './index';

describe('Express App', () => {
  it('should respond with the correct version on the root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe(`Hello ha-addon-curve ${version}!`);
  });

  afterAll(done => {app.close(done);});
});
