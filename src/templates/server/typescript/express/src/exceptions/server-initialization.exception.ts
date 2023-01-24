export class ServerInitializationException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ServerInitializationException.prototype);
  }
}
