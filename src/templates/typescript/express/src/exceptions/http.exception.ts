export type HttpExceptionOptions = {
  cause?: Error;
  description?: string;
  event?: string;
};

export class HttpException extends Error {
  constructor(
    private readonly status: number,
    private readonly response: string | Record<string, any>,
    private readonly options?: HttpExceptionOptions // used for logs
  ) {
    super();
  }

  public getResponse(): string | object {
    return typeof this.response === 'object'
      ? this.response
      : {
          statusCode: this.status,
          message: this.response,
        };
  }

  public getStatus(): number {
    return this.status;
  }

  public getLogObject() {
    return this.options;
  }
}
