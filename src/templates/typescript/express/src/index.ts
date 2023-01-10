import type { Server } from 'http';

import { config, logger, transport } from '$/config';
import { ServerInitializationException } from '$/exceptions';
import { prisma } from '$/lib';
import { isTest } from '$/utils';

import { app } from './app';

let server: Server;

const exitHandler = () => {
  if (server) {
    server.close();
  }

  logger.info('Server closed');

  // wait until all async writes are completed
  setTimeout(() => {
    process.exit(1);
  }, 3000);
};

prisma
  .$connect()
  .then(() => {
    logger.info('Connected to Database');

    transport
      .verify()
      .then(() => {
        logger.info('Connected to email server');

        server = app.listen(config.port, () =>
          logger.info(`Server listening on port ${config.port}`)
        );
      })
      .catch(() => {
        if (isTest()) return;
        throw new ServerInitializationException(
          'Failed to connect to email server'
        );
      });
  })
  .catch(() => {
    throw new ServerInitializationException('Failed to connect to Database');
  });

const unexpectedErrorHandler = async (error: any) => {
  if (error instanceof ServerInitializationException) {
    logger.fatal(error.message);
  } else {
    logger.fatal(error);
  }

  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.fatal('SIGTERM received');
  if (server) {
    server.close();
    logger.info('Server closed');
  }
});
