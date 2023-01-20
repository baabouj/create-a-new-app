import type { Server } from 'http';

import { app } from '$/app';
import { config } from '$/config';
import { prisma } from '$/lib';

let server: Server;

const setup = () => {
  beforeAll(async () => {
    await prisma.$connect();
    server = app.listen(config.port);
  });

  afterAll(async () => {
    server.close();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
};

export { setup };
