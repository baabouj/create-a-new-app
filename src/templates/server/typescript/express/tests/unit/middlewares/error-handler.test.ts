import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';

import { HttpException } from '$/exceptions';
import { errorHandler } from '$/middlewares';

describe('Error Handler middleware', () => {
  test('should send status code and message', () => {
    const error = new HttpException(httpStatus.BAD_REQUEST, 'Any message');
    const res = httpMocks.createResponse();
    const sendSpy = vi.spyOn(res, 'send');
    const statusSpy = vi.spyOn(res, 'status');

    errorHandler(error, httpMocks.createRequest(), res, vi.fn() as any);

    expect(statusSpy).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Any message',
      })
    );
  });

  test('should send custom response', () => {
    const customResponse = {
      custom: 'custom response',
    };
    const error = new HttpException(httpStatus.BAD_REQUEST, customResponse);
    const res = httpMocks.createResponse();
    const sendSpy = vi.spyOn(res, 'send');
    const statusSpy = vi.spyOn(res, 'status');

    errorHandler(error, httpMocks.createRequest(), res, vi.fn() as any);

    expect(statusSpy).toHaveBeenCalledWith(error.getStatus());
    expect(sendSpy).toHaveBeenCalledWith(customResponse);
  });

  test('should convert an Error to an Internal Server Error Exception', () => {
    const error = new Error('Any error');
    const res = httpMocks.createResponse();
    const sendSpy = vi.spyOn(res, 'send');
    const statusSpy = vi.spyOn(res, 'status');

    errorHandler(error, httpMocks.createRequest(), res, vi.fn() as any);
    expect(statusSpy).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
      })
    );
  });
});
