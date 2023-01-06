import httpStatus from 'http-status';

import { BadRequestException } from './bad-request.exception';

export type ValidationError = {
  field: string;
  error: string;
};

export class ValidationException extends BadRequestException {
  constructor(errors: ValidationError[]) {
    super({
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors,
    });
  }
}
