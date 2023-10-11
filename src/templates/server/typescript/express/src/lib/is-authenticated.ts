import type { Request } from 'express';
import passport from 'passport';

const verifyCallback =
  (req: Request, resolve: any, reject: any) =>
  async (err: any, user: any, info: any) => {
    if (err || info || !user) return reject();
    req.user = user;
    return resolve();
  };

const isAuthenticated = async (req: Request) => {
  return new Promise((resolve, reject) => {
    passport.authenticate(
      'jwt',
      { session: false },
      verifyCallback(req, resolve, reject),
    )(req);
  })
    .then(() => true)
    .catch(() => false);
};

export { isAuthenticated };
