import type { Server } from 'http';
import pactum from 'pactum';

import { app } from '../src/app';

let server: Server;

beforeAll(() => {
  const PORT = 4000;
  server = app.listen(PORT);

  pactum.request.setBaseUrl(`http://localhost:${PORT}`);
});

afterAll(() => {
  server.close();
});

it('should return hello world', async () => {
  await pactum.spec().get('/hello').expectBody('Hello, World!');
});
