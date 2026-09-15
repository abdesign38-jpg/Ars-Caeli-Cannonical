export class ObservationRuntimeError extends Error {
  constructor(code, message, details = {}, recoverable = false) {
    super(message);
    this.name = "ObservationRuntimeError";
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;
  }
}
