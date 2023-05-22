const request = require('supertest');
const app = require('./app');

describe('Tests sur mes routes : ', () => {

it('1) route GET /users/add/:token', async () => {
	const res = await request(app).get(`/users/add/WyJI8csexBnsPmJJa7JK-i0VXnpbS_2W`);
	expect(res.statusCode).toBe(200);
	expect(res.body.result).toBe(true);
});

// Ce test ne peut être effectué qu'une seule fois, car ensuite les informations seront déjà dans 
// la base de données et ne pourront pas être enregistrées à nouveau. Pour refaire le test, il faudra modifier 
// les informations fournies.
it('2) route POST /users/signup', async () => {
    const user = {
      firstname: 'Kam',
      username: 'Trinity0077',
      email: 'Trinity@0077.com',
      password: '123456supercode',
      age: '2020-05-02T18:32:08.352Z',
      gender: 'Femme'
    };

    const res = await request(app).post('/users/signup').send(user);
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.token).toBeTruthy(); // Vérifie que la réponse contient un token non vide
  });

});