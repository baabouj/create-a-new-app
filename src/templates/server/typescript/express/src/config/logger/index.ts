import pinoHttp from 'pino-http';

import { options } from './options';

const pino = pinoHttp(options);

const { logger } = pino;

export { logger, pino };
