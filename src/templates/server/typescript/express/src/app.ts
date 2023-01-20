import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import passport from 'passport';

import { jwtStrategy, pino } from '$/config';
import { HttpException } from '$/exceptions';
import { errorHandler } from '$/middlewares';
import { v1Router } from '$/routes';

const app = express();

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(pino);

app.use(cors());
app.options('*', cors());

app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use('/api/v1', v1Router);

app.use((_req, _res, next) => {
  next(
    new HttpException(httpStatus.NOT_FOUND, 'Not Found', {
      event: 'resource_not_found',
      description: "Attempt to access a resource that doesn't exist",
    })
  );
});

app.use(errorHandler);

export { app };
