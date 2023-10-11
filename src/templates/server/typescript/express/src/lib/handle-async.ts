import type { RequestHandler } from 'express';
import { type Schema } from 'zod';

import {
  UnauthorizedException,
  type ValidationError,
  ValidationException,
} from '$/exceptions';

import { isAuthenticated } from './is-authenticated';
import { parseSchema } from './parse-schema';

const handleAsync = <TBody, TQuery, TParams>(
  fn: RequestHandler<TParams, any, TBody, TQuery>,
  settings?: {
    schema?: {
      body?: Schema<TBody>;
      query?: Schema<TQuery>;
      params?: Schema<TParams>;
    };
    auth?: boolean;
  },
): RequestHandler => {
  return async (req, res, next) => {
    if (settings?.auth) {
      const authenticated = await isAuthenticated(req);
      if (!authenticated) return next(new UnauthorizedException());
    }

    if (settings?.schema) {
      let errors: ValidationError[] = [];
      for (const [key, keySchema] of Object.entries(settings.schema)) {
        const result = parseSchema((req as any)[key], keySchema);

        if (!result.success) {
          errors = [...errors, ...result.errors];
        } else {
          (req as any)[key] = result.data;
        }
      }
      if (errors.length > 0) {
        return next(new ValidationException(errors));
      }
    }

    return Promise.resolve(fn(req as any, res, next)).catch((err) => next(err));
  };
};

export { handleAsync };
