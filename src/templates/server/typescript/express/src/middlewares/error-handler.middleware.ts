import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { HttpException } from '$/exceptions';
import { isDev, isProduction } from '$/utils';

const errorConverter = (
  err: Error | HttpException,
  req: Request,
): HttpException => {
  if (!(err instanceof HttpException)) {
    if (isDev()) {
      req.log.error(err);
    }

    return new HttpException(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Internal Server Error',
      {
        cause: err,
        event: 'sys_error',
        description: 'Internal server error',
      },
    );
  }

  return err;
};

const errorHandler = (
  err: Error | HttpException,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const exception = errorConverter(err, req);

  if (isProduction()) {
    if (exception.getStatus() === httpStatus.INTERNAL_SERVER_ERROR) {
      req.log.error(exception.getLogObject());
    } else {
      req.log.warn(exception.getLogObject());
    }
  }

  res.status(exception.getStatus()).send(exception.getResponse());
};

export { errorHandler };
