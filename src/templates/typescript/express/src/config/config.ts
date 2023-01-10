import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load env variables to process.env
dotenv.config();

const zodSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .default('4000'),
  DATABASE_URL: z.string().describe('Database url'),
  JWT_SECRET: z.string().describe('access token secret key').min(16),
  JWT_MAX_AGE: z
    .string()
    .default('5min')
    .describe(
      'time when access token will be expired : a string describing a time span vercel/ms (https://github.com/vercel/ms). Eg: 60, "10m", "10h", "7d"'
    ),
  REFRESH_TOKEN_MAX_AGE: z
    .string()
    .default('1d')
    .describe(
      'time when refresh token will be expired : a string describing a time span vercel/ms (https://github.com/vercel/ms). Eg: 60, "10m", "10h", "7d"'
    ),
  EMAIL_VERIFICATION_TOKEN_MAX_AGE: z
    .string()
    .default('5m')
    .describe(
      'time when email verification token will be expired : a string describing a time span vercel/ms (https://github.com/vercel/ms). Eg: 60, "10m", "10h", "7d"'
    ),
  EMAIL_VERIFICATION_FRONTEND_URL: z
    .string()
    .url()
    .describe(
      'the url to the email verification page on the the front-end app'
    ),
  RESET_PASSWORD_TOKEN_MAX_AGE: z
    .string()
    .default('5m')
    .describe(
      'time when reset password token will be expired : a string describing a time span vercel/ms (https://github.com/vercel/ms). Eg: 60, "10m", "10h", "7d"'
    ),
  RESET_PASSWORD_FRONTEND_URL: z
    .string()
    .url()
    .describe('the url to the reset password page on the the front-end app'),
  ENCRYPTION_KEY: z.string().describe('encryption key').min(16),
  SMTP_HOST: z.string().describe('server that will send the emails'),
  SMTP_PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .describe('port to connect to the email server'),
  SMTP_USERNAME: z.string().describe('username for email server'),
  SMTP_PASSWORD: z.string().describe('password for email server'),
  EMAIL_FROM: z
    .string()
    .describe('the from field in the emails sent by the app'),
});

const result = zodSchema.safeParse(process.env);

if (!result.success) {
  const missingEnvVars = result.error.errors.map((err) => err.path.toString());
  throw new Error(
    `Some environment variables are missing or invalid : ${missingEnvVars.join(
      ', '
    )}`
  );
}

const { data: envVars } = result;

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    maxAge: envVars.JWT_MAX_AGE,
  },
  refreshToken: {
    maxAge: envVars.REFRESH_TOKEN_MAX_AGE,
  },
  emailVerificationToken: {
    maxAge: envVars.EMAIL_VERIFICATION_TOKEN_MAX_AGE,
    frontendPageUrl: envVars.EMAIL_VERIFICATION_FRONTEND_URL,
  },
  resetPasswordToken: {
    maxAge: envVars.RESET_PASSWORD_TOKEN_MAX_AGE,
    frontendPageUrl: envVars.RESET_PASSWORD_FRONTEND_URL,
  },
  encryption: {
    key: envVars.ENCRYPTION_KEY,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
};

export { config };
