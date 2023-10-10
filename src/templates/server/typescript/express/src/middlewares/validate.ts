/* eslint-disable security/detect-object-injection */
import type { NextFunction, Request, Response } from 'express';
import type { Schema } from 'zod';

import type { ValidationError } from '$/exceptions';
import { ValidationException } from '$/exceptions';

const parse = <T>(
  data: T,
  schema: Schema,
):
  | { success: true; data: T }
  | {
      success: false;
      errors: ValidationError[];
    } => {
  const result = schema.safeParse(data);

  if (result.success) return result;

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    error: err.message,
  }));

  return {
    success: false,
    errors,
  };
};

const validate =
  (
    schema: { body?: Schema; params?: Schema; query?: Schema },
    whitelist = true,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    let errors: ValidationError[] = [];
    Object.keys(schema).forEach((k) => {
      const key = k as keyof typeof schema;
      const result = parse(req[key], schema[key] as Schema);

      if (!result.success) errors = [...errors, ...result.errors];
      else if (whitelist) req[key] = result.data;
    });

    if (errors.length > 0) {
      return next(new ValidationException(errors));
    }

    return next();
  };

export { validate };
