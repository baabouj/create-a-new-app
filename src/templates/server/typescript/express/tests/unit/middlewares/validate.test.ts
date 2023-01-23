import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import { z } from 'zod';

import { HttpException } from '$/exceptions';
import { validate } from '$/middlewares';

describe('Validation middleware', () => {
  test('should call next with no errors if schema is valid', () => {
    const schema = z.object({
      test: z.string(),
    });
    const next = vi.fn();
    const req = httpMocks.createRequest({
      body: {
        test: 'body test',
      },
      query: {
        test: 'query test',
      },
      params: {
        test: 'params test',
      },
    });

    validate({
      body: schema,
      query: schema,
      params: schema,
    })(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with validation error if schema is not valid', () => {
    const schema = z.object({
      test: z.string(),
    });
    const next = vi.fn();

    validate({
      body: schema,
      query: schema,
      params: schema,
    })(httpMocks.createRequest(), httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: httpStatus.BAD_REQUEST,
        response: expect.objectContaining({
          statusCode: httpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            {
              field: 'test',
              error: expect.any(String),
            },
          ]),
        }),
      })
    );
  });

  test('should call next with validation error and custom error messages', () => {
    const schema = z.object({
      test: z.string({
        required_error: 'test is required',
      }),
    });
    const next = vi.fn();

    validate({
      body: schema,
      query: schema,
      params: schema,
    })(httpMocks.createRequest(), httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: httpStatus.BAD_REQUEST,
        response: expect.objectContaining({
          statusCode: httpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            {
              field: 'test',
              error: 'test is required',
            },
          ]),
        }),
      })
    );
  });
});
