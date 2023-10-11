import type { Schema } from 'zod';

import type { ValidationError } from '$/exceptions';

const parseSchema = <T>(
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

export { parseSchema };
