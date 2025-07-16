// Professional health check test for backend API
const axios = require('axios');

describe('API Health Check', () => {
  it('should return success and status 200 for / endpoint', async () => {
    const res = await axios.get('http://localhost:5000/');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.message).toMatch(/TestLoom API Server is running!/);
  });
});
