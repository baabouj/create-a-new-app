import type { NextFunction, Request, Response } from 'express';
import passport from 'passport';

import { UnauthorizedException } from '$/exceptions';

const verifyCallback =
  (req: Request, resolve: any, reject: any) =>
  async (err: any, user: any, info: any) => {
    if (err || info || !user) return reject(new UnauthorizedException());
    req.user = user;
    return resolve();
  };

const auth = async (req: Request, res: Response, next: NextFunction) => {
  return new Promise((resolve, reject) => {
    passport.authenticate(
      'jwt',
      { session: false },
      verifyCallback(req, resolve, reject),
    )(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

export { auth };
