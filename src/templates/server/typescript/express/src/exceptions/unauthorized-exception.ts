import httpStatus from 'http-status';

import { HttpException } from './http.exception';

export class UnauthorizedException extends HttpException {
  constructor() {
    super(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}
