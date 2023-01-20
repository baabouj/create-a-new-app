import type { Request } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';

import { userService } from '$/services';
import { decrypt, exclu } from '$/utils';

import { config } from './config';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: (req: Request) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    if (!token) return '';
    return decrypt(token);
  },
};

const jwtVerify = async (payload: any, done: any) => {
  const user = await userService.find(payload.sub);

  if (!user) {
    return done(null, false);
  }
  return done(null, exclu(user, ['password']));
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export { jwtStrategy };
