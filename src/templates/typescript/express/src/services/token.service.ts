import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import ms from 'ms';

import { config } from '$/config';
import type { TokenType } from '$/constants';
import { TOKEN_TYPES } from '$/constants';
import { prisma } from '$/lib';
import { decrypt, encrypt } from '$/utils';

const generateJwt = (userId: string): string => {
  const token = jwt.sign({ sub: userId }, config.jwt.secret, {
    expiresIn: config.jwt.maxAge,
  });

  return encrypt(token);
};

const verifyJwt = (token: string) => {
  try {
    const payload = jwt.verify(decrypt(token), config.jwt.secret);

    return payload as { sub: string };
  } catch {
    return null;
  }
};

const saveToken = async (
  userId: string,
  token: string,
  type: TokenType,
  expires: number
) => {
  const expiresAt = new Date(expires);
  const createdToken = await prisma.token.create({
    data: {
      token: encrypt(token),
      type,
      userId,
      expiresAt,
    },
  });
  return createdToken;
};

const findToken = async (token: string, type: TokenType) => {
  const foundToken = await prisma.token.findFirst({
    where: {
      token: encrypt(token),
      type,
    },
  });
  return foundToken;
};

const deleteToken = async (id: string) => {
  await prisma.token.delete({
    where: {
      id,
    },
  });
};

const generateOpaqueToken = () => {
  return randomBytes(24).toString('base64url');
};

const generateRefreshToken = async (userId: string) => {
  const token = generateOpaqueToken();
  await saveToken(
    userId,
    token,
    TOKEN_TYPES.REFRESH,
    Date.now() + ms(config.refreshToken.maxAge)
  );
  return token;
};

const generateEmailVerificationToken = async (userId: string) => {
  const token = generateOpaqueToken();
  await saveToken(
    userId,
    token,
    TOKEN_TYPES.EMAIL_VERIFICATION,
    Date.now() + ms(config.emailVerificationToken.maxAge)
  );
  return token;
};

const generateResetPasswordToken = async (userId: string) => {
  const token = generateOpaqueToken();
  await saveToken(
    userId,
    token,
    TOKEN_TYPES.RESET_PASSWORD,
    Date.now() + ms(config.resetPasswordToken.maxAge)
  );
  return token;
};

const findRefreshToken = async (token: string) => {
  const refreshToken = await findToken(token, TOKEN_TYPES.REFRESH);
  return refreshToken;
};

const generateAuthTokens = async (userId: string) => {
  const accessToken = generateJwt(userId);

  const refreshToken = await generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
  };
};

const deleteUserRefreshTokens = (userId: string) => {
  return prisma.token.deleteMany({
    where: {
      type: TOKEN_TYPES.REFRESH,
      userId,
    },
  });
};

const findEmailVerificationToken = async (token: string) => {
  const emailVerificationToken = await findToken(
    token,
    TOKEN_TYPES.EMAIL_VERIFICATION
  );
  return emailVerificationToken;
};

const findResetPasswordToken = async (token: string) => {
  const resetPasswordToken = await findToken(token, TOKEN_TYPES.RESET_PASSWORD);
  return resetPasswordToken;
};

export {
  deleteToken,
  deleteUserRefreshTokens,
  findEmailVerificationToken,
  findRefreshToken,
  findResetPasswordToken,
  generateAuthTokens,
  generateEmailVerificationToken,
  generateJwt,
  generateOpaqueToken,
  generateRefreshToken,
  generateResetPasswordToken,
  verifyJwt,
};
