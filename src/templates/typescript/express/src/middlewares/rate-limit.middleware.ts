import expressRateLimit from 'express-rate-limit';

const rateLimit = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

export { rateLimit };
