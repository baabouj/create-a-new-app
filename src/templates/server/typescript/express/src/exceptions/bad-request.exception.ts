import httpStatus from 'http-status';

import type { HttpExceptionOptions } from './http.exception';
import { HttpException } from './http.exception';

export class BadRequestException extends HttpException {
  constructor(
    response: string | Record<string, any> = 'Bad Request',
    options?: HttpExceptionOptions,
  ) {
    super(httpStatus.BAD_REQUEST, response, options);
  }
}
