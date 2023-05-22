const request = require('supertest');
const app = require('./app');

describe('Tests sur mes routes : ', () => {
it('1) route GET /users/add/:token', async () => {
	const res = await request(app).get(`/users/add/yuJipnlpX2__2zcg4C6V9POautn4SPrb`);
	expect(res.statusCode).toBe(200);
	expect(res.body.result).toBe(true);
});
});
