import { Prisma } from '@prisma/client';

import { BadRequestException } from '$/exceptions';
import { emailService, tokenService, userService } from '$/services';
import { hash } from '$/utils';
import type { SignupBody } from '$/validations';

const login = async (email: string, password: string) => {
  const user = await userService.findByEmail(email);

  if (!user) {
    throw new BadRequestException('Invalid email or password', {
      event: 'authn_login_fail',
      description: 'failed login attempt',
    });
  }

  const isMatched = await hash.verify(user.password, password);

  if (!isMatched) {
    throw new BadRequestException('Invalid email or password', {
      event: `authn_login_fail:${user.id}`,
      description: `User ${user.id} login failed`,
    });
  }

  return user;
};

const signup = async ({ password, ...user }: SignupBody) => {
  try {
    const hashedPassword = await hash.make(password);

    const createdUser = await userService.create({
      password: hashedPassword,
      ...user,
    });

    emailService.sendVerificationEmail(createdUser.email, createdUser.id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      // we dont want to throw error if it's a unique constraint error (email already exist)
      // to prevent an attacker enumerating which accounts exist
      return;
    }

    throw error;
  }
};

const verifyEmail = async (token: string) => {
  const foundToken = await tokenService.findEmailVerificationToken(token);

  if (!foundToken) {
    throw new BadRequestException('Email verification failed', {
      event: `authn_email_verification_fail:invalid_token`,
      description: `Failed attempt to verify email`,
    });
  }
  await tokenService.deleteToken(foundToken.id);

  if (foundToken.expiresAt.getTime() < Date.now()) {
    throw new BadRequestException('Email verification failed', {
      event: 'authn_email_verification_fail:token_expires',
      description: `User ${foundToken.userId} attempted to use token with id ${foundToken.id} which was expired`,
    });
  }

  const verifiedUser = await userService.update(foundToken.userId, {
    emailVerifiedAt: new Date(),
  });
  return verifiedUser;
};

const changePassword = async (
  id: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await userService.find(id);
  if (!user) {
    throw new BadRequestException('Password change failed', {
      event: `authn_password_change_fail:user_not_found`,
      description: `Failed attempt to change password`,
    });
  }

  const isMatched = await hash.verify(user.password, oldPassword);
  if (!isMatched) {
    throw new BadRequestException('Password change failed', {
      event: `authn_password_change_fail:${user.id},wrong_password`,
      description: `User ${user.id} failed to change their password`,
    });
  }

  const newHashedPassword = await hash.make(newPassword);

  await tokenService.deleteUserRefreshTokens(user.id);

  await userService.update(user.id, { password: newHashedPassword });
};

const resetPassword = async (token: string, password: string) => {
  const foundToken = await tokenService.findResetPasswordToken(token);

  if (!foundToken) {
    throw new BadRequestException('Password reset failed', {
      event: `authn_password_reset_fail:invalid_token`,
      description: 'Failed attempt to reset password',
    });
  }

  await tokenService.deleteToken(foundToken.id);

  if (foundToken.expiresAt.getTime() < Date.now()) {
    throw new BadRequestException('Password reset failed', {
      event: 'authn_password_reset_fail:token_expires',
      description: `User ${foundToken.userId} attempted to use token with id ${foundToken.id} which was expired`,
    });
  }

  const hashedPassword = await hash.make(password);

  const updatedUser = await userService.update(foundToken.userId, {
    password: hashedPassword,
  });
  return updatedUser;
};

const sendVerificationEmail = async (userId: string) => {
  const user = await userService.find(userId);

  if (!user || user.emailVerifiedAt) return;

  emailService.sendVerificationEmail(user.email, user.id);
};

const sendResetPasswordEmail = async (email: string) => {
  const user = await userService.findByEmail(email);
  if (!user) return;

  emailService.sendResetPasswordEmail(email, user.id);
};

export {
  changePassword,
  login,
  resetPassword,
  sendResetPasswordEmail,
  sendVerificationEmail,
  signup,
  verifyEmail,
};
