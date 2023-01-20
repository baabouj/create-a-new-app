import type { User } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import ms from 'ms';

import { config } from '$/config';
import { BadRequestException } from '$/exceptions';
import { handleAsync } from '$/lib';
import { authService, tokenService } from '$/services';

const login = handleAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.login(email, password);

  const cookieToken: string = req.cookies['__Host-token'];

  if (cookieToken) {
    const foundRefreshToken = await tokenService.findRefreshToken(cookieToken);

    if (foundRefreshToken) await tokenService.deleteToken(foundRefreshToken.id);

    res.clearCookie('__Host-token', {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  const { accessToken, refreshToken } = await tokenService.generateAuthTokens(
    user.id
  );

  res.cookie('__Host-token', refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ms(config.refreshToken.maxAge),
  });

  req.log.info({
    event: `authn_login_success:${user.id}`,
    description: `User ${user.id} login successfully`,
  });

  res.send({
    access_token: accessToken,
  });
});

const signup = handleAsync(async (req: Request, res: Response) => {
  await authService.signup(req.body);
  res.send({
    message:
      'A link to activate your account has been emailed to the address provided.',
  });
});

const refresh = handleAsync(async (req: Request, res: Response) => {
  const cookieToken = req.cookies['__Host-token'];

  if (!cookieToken) throw new BadRequestException();

  res.clearCookie('__Host-token', {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  const token = await tokenService.findRefreshToken(cookieToken);
  if (!token) throw new BadRequestException();

  const { accessToken, refreshToken } = await tokenService.generateAuthTokens(
    token.userId
  );
  await tokenService.deleteToken(token.id);

  res.cookie('__Host-token', refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ms(config.refreshToken.maxAge),
  });

  res.send({
    access_token: accessToken,
  });
});

const logout = handleAsync(async (req, res) => {
  const token = req.cookies['__Host-token'];

  const edToken = token;

  if (token && edToken) {
    res.clearCookie('__Host-token', {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });

    const refreshToken = await tokenService.findRefreshToken(edToken);

    if (refreshToken) await tokenService.deleteToken(refreshToken.id);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = handleAsync(async (req, res) => {
  const user = await authService.verifyEmail(req.query.token as string);

  req.log.info({
    event: `authn_email_verification_success:${user.id}`,
    description: `User ${user.id} has successfully verified their email`,
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = handleAsync(async (req, res) => {
  const userId = (req.user as User).id;
  await authService.changePassword(
    userId,
    req.body.oldPassword,
    req.body.newPassword
  );

  req.log.info({
    event: `authn_password_change:${userId}`,
    description: `User ${userId} has successfully changed their password`,
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = handleAsync(async (req, res) => {
  await authService.sendResetPasswordEmail(req.body.email);

  res.send({
    message:
      'If that email address is in our database, an email is sent to reset your password',
  });
});

const resetPassword = handleAsync(async (req, res) => {
  const user = await authService.resetPassword(
    req.query.token as string,
    req.body.password
  );

  req.log.info({
    event: `authn_password_reset_success:${user.id}`,
    description: `User ${user.id} has successfully reset their password`,
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = handleAsync(async (req, res) => {
  await authService.sendVerificationEmail((req.user as User).id);

  res.send({
    message:
      'If your email address is not already verified, an email is sent to verify your email address',
  });
});

const findAuthedUser = handleAsync(async (req: Request, res: Response) => {
  res.send(req.user);
});

export {
  changePassword,
  findAuthedUser,
  forgotPassword,
  login,
  logout,
  refresh,
  resetPassword,
  sendVerificationEmail,
  signup,
  verifyEmail,
};
