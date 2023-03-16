import pino from 'pino';

import { app } from './app';

const port = 4000;

const logger = pino();

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
