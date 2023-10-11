import cookie from 'cookie';
import httpStatus from 'http-status';
import pactum from 'pactum';

import { emailService, tokenService, userService } from '$/services';
import { hash, only } from '$/utils';

import type { User } from '../fixtures/user.fixture';
import { generateUser, insertUsers } from '../fixtures/user.fixture';
import { setup } from '../utils/setup';

setup();
describe('Auth routes', () => {
  beforeAll(() => {
    pactum.request.setBaseUrl('http://localhost:4000/api');
  });

  describe('POST /v1/auth/signup', () => {
    let newuser: User & {
      confirm?: string;
    };
    beforeEach(() => {
      newuser = generateUser();
      newuser.confirm = newuser.password;
    });

    test('should return 200 and successfully signup user if request data is ok and send verification email', async () => {
      const sendVerificationEmailSpy = vi.spyOn(
        emailService,
        'sendVerificationEmail',
      );

      await pactum
        .spec()
        .post('/v1/auth/signup')
        .withBody(newuser)
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'A link to activate your account has been emailed to the address provided.',
        });

      const user = await userService.findByEmail(newuser.email);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
        user?.email,
        user?.id,
      );
    });

    test('should return 400 error if email is invalid', async () => {
      newuser.email = 'invalidEmail';

      await pactum
        .spec()
        .post('/v1/auth/signup')
        .withBody(newuser)
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test('should return 200 error if email is already used', async () => {
      const dummyuser = generateUser();
      await insertUsers([dummyuser]);
      newuser.email = dummyuser.email;

      await pactum
        .spec()
        .post('/v1/auth/signup')
        .withBody(newuser)
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'A link to activate your account has been emailed to the address provided.',
        });
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newuser.password = 'passwo1';

      await pactum
        .spec()
        .post('/v1/auth/signup')
        .withBody(newuser)
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password doesn't match", async () => {
      newuser.confirm = 'notmatched';

      await pactum
        .spec()
        .post('/v1/auth/signup')
        .withBody(newuser)
        .expectStatus(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      const user = generateUser();
      await insertUsers([user]);

      const loginCredentials = {
        email: user.email,
        password: user.password,
      };
      pactum.handler.addCaptureHandler('refresh token', (ctx) => {
        return cookie.parse(ctx.res.headers['set-cookie']?.[0] as string)[
          '__Host-token'
        ];
      });

      await pactum
        .spec()
        .post('/v1/auth/login')
        .withBody(loginCredentials)
        .expectStatus(httpStatus.OK)
        .expectBodyContains('access_token')
        .expect((ctx) => {
          const cookies = cookie.parse(
            ctx.res.headers['set-cookie']?.[0] as string,
          );
          expect(cookies).toHaveProperty('__Host-token');
        })
        .expect((ctx) => {
          const payload = tokenService.verifyJwt(ctx.res.body.access_token);

          expect(payload?.sub).toBe(user.id);
        })
        .stores('access_token', 'access_token')
        .stores('refresh_token', '#refresh token');
    });

    test('should return 400 error if there are no user with that email', async () => {
      const user = generateUser();
      const loginCredentials = {
        email: user.email,
        password: user.password,
      };

      await pactum
        .spec()
        .post('/v1/auth/login')
        .withBody(loginCredentials)
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectBodyContains('Invalid email or password');
    });

    test('should return 400 error if password is wrong', async () => {
      const user = generateUser();
      await insertUsers([user]);
      const loginCredentials = {
        email: user.email,
        password: 'wrongpassword',
      };

      await pactum
        .spec()
        .post('/v1/auth/login')
        .withBody(loginCredentials)
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectBodyContains('Invalid email or password');
    });
  });

  describe('POST /v1/auth/logout', () => {
    test('should return 204 if logged out successfully', async () => {
      await pactum
        .spec()
        .post('/v1/auth/logout')
        .withHeaders('Authorization', 'Bearer $S{access_token}')
        .expectStatus(httpStatus.NO_CONTENT);
    });

    test('should return 401 error if Authorization header is missing or has an invalid token', async () => {
      await pactum
        .spec()
        .post('/v1/auth/logout')
        .expectStatus(httpStatus.UNAUTHORIZED);

      await pactum
        .spec()
        .post('/v1/auth/logout')
        .withHeaders('Authorization', 'Bearer invalidtoken')
        .expectStatus(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    test('should return 200 and new access token if refresh token is valid', async () => {
      await pactum
        .spec()
        .post('/v1/auth/refresh')
        .withCookies('__Host-token', '$S{refresh_token}')
        .expectStatus(httpStatus.OK)
        .expectBodyContains('access_token')
        .expect((ctx) => {
          const refreshTokenCookie = ctx.res.headers['set-cookie']?.[1];
          expect(refreshTokenCookie).toContain('__Host-token');
          expect(refreshTokenCookie).toContain('HttpOnly');
          expect(refreshTokenCookie).toContain('Secure');
        });
    });

    test('should return 400 error if refresh token is already used', async () => {
      await pactum
        .spec()
        .post('/v1/auth/refresh')
        .withCookies('__Host-token', '$S{refresh_token}')
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if refresh token is missing from request cookies', async () => {
      await pactum
        .spec()
        .post('/v1/auth/refresh')
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if refresh token doesn't exist in database", async () => {
      const user = generateUser();
      await insertUsers([user]);
      const refreshToken = tokenService.generateOpaqueToken();

      await pactum
        .spec()
        .post('/v1/auth/refresh')
        .withCookies('__Host-token', refreshToken)
        .expectStatus(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/me', () => {
    test('should return 200 and authenticated user', async () => {
      const [user] = await insertUsers([generateUser()]);

      const accessToken = tokenService.generateJwt(user.id);

      await pactum
        .spec()
        .get('/v1/auth/me')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .expectStatus(httpStatus.OK)
        .expectJsonLike(only(user, ['id', 'name', 'email']));
    });

    test('should return 401 error if not authenticated', async () => {
      await pactum
        .spec()
        .get('/v1/auth/me')
        .expectStatus(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /v1/auth/change-password', () => {
    test('should return 204 if password changed successfully', async () => {
      const user = generateUser();
      await insertUsers([user]);

      const accessToken = tokenService.generateJwt(user.id);

      await pactum
        .spec()
        .post('/v1/auth/change-password')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .withBody({
          oldPassword: user.password,
          newPassword: 'password2',
        })
        .expectStatus(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if old password is wrong', async () => {
      const user = generateUser();
      await insertUsers([user]);

      const accessToken = tokenService.generateJwt(user.id);

      await pactum
        .spec()
        .post('/v1/auth/change-password')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .withBody({
          oldPassword: 'wrongpassword',
          newPassword: 'password2',
        })
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectBodyContains('Password change failed');
    });

    test('should return 401 error if not authorized', async () => {
      await pactum
        .spec()
        .post('/v1/auth/change-password')
        .withBody({
          oldPassword: 'wrongpassword',
          newPassword: 'password2',
        })
        .expectStatus(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if passwords are missing or less than 8 characters', async () => {
      const user = generateUser();
      await insertUsers([user]);

      const accessToken = tokenService.generateJwt(user.id);

      await pactum
        .spec()
        .post('/v1/auth/change-password')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectBodyContains('newPassword')
        .expectBodyContains('oldPassword');

      await pactum
        .spec()
        .post('/v1/auth/change-password')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .withBody({
          oldPassword: 'passwrd',
          newPassword: 'short',
        })
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectBodyContains('newPassword')
        .expectBodyContains('oldPassword');
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    test('should return 200 and send reset password email to the user if user exists', async () => {
      const user = generateUser();
      await insertUsers([user]);
      const sendResetPasswordEmailSpy = vi.spyOn(
        emailService,
        'sendResetPasswordEmail',
      );

      await pactum
        .spec()
        .post('/v1/auth/forgot-password')
        .withBody({ email: user.email })
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'If that email address is in our database, an email is sent to reset your password',
        });

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(
        user.email,
        user.id,
      );
    });

    test('should return 400 if email is missing or invalid', async () => {
      await pactum
        .spec()
        .post('/v1/auth/forgot-password')
        .expectStatus(httpStatus.BAD_REQUEST);
      await pactum
        .spec()
        .post('/v1/auth/forgot-password')
        .withBody({ email: 'invalidemail' })
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test("should return 200 but won't send reset password email to the user if email doesn't exists", async () => {
      const user = generateUser();

      const sendResetPasswordEmailSpy = vi.spyOn(
        emailService,
        'sendResetPasswordEmail',
      );

      await pactum
        .spec()
        .post('/v1/auth/forgot-password')
        .withBody({ email: user.email })
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'If that email address is in our database, an email is sent to reset your password',
        });

      expect(sendResetPasswordEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    test('should return 204 and reset password if token is valid', async () => {
      const [user] = await insertUsers([generateUser()]);

      const resetPasswordToken = await tokenService.generateResetPasswordToken(
        user.id,
      );

      const password = 'newpassword';
      await pactum
        .spec()
        .post('/v1/auth/reset-password')
        .withQueryParams('token', resetPasswordToken)
        .withBody({ password })
        .expectStatus(httpStatus.NO_CONTENT);

      const updateduser = await userService.find(user.id);

      const isMatched = await hash.verify(
        updateduser?.password as string,
        password,
      );

      expect(isMatched).toBe(true);
    });

    test('should return 400 if password is missing or invalid', async () => {
      const resetPasswordToken = tokenService.generateOpaqueToken();

      await pactum
        .spec()
        .post('/v1/auth/reset-password')
        .withQueryParams('token', resetPasswordToken)
        .withBody({ password: 'short' })
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if token is missing', async () => {
      await pactum
        .spec()
        .post('/v1/auth/reset-password')
        .withBody({ password: 'newpassword' })
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if token is invalid or user doesn't exist", async () => {
      const resetPasswordToken = tokenService.generateOpaqueToken();

      await pactum
        .spec()
        .post('/v1/auth/reset-password')
        .withQueryParams('token', 'invalidtoken')
        .withBody({ password: 'newpassword' })
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectJsonLike({
          message: 'Password reset failed',
        });

      await pactum
        .spec()
        .post('/v1/auth/reset-password')
        .withQueryParams('token', resetPasswordToken)
        .withBody({ password: 'newpassword' })
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectJsonLike({
          message: 'Password reset failed',
        });
    });
  });

  describe('POST /v1/auth/verify-email', () => {
    test('should return 204 and verify email if token is valid', async () => {
      const user = generateUser();
      await insertUsers([user]);

      const emailVerificationToken =
        await tokenService.generateEmailVerificationToken(user.id);

      await pactum
        .spec()
        .post('/v1/auth/verify-email')
        .withQueryParams('token', emailVerificationToken)
        .expectStatus(httpStatus.NO_CONTENT);

      const verifieduser = await userService.find(user.id);

      expect(verifieduser?.emailVerifiedAt).toBeDefined();
    });

    test('should return 400 if token is missing', async () => {
      await pactum
        .spec()
        .post('/v1/auth/verify-email')
        .expectStatus(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if token is invalid or user doesn't exist", async () => {
      const emailVerificationToken = tokenService.generateOpaqueToken();

      await pactum
        .spec()
        .post('/v1/auth/verify-email')
        .withQueryParams('token', 'invalidtoken')
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectJsonLike({
          message: 'Email verification failed',
        });

      await pactum
        .spec()
        .post('/v1/auth/verify-email')
        .withQueryParams('token', emailVerificationToken)
        .expectStatus(httpStatus.BAD_REQUEST)
        .expectJsonLike({
          message: 'Email verification failed',
        });
    });
  });

  describe('POST /v1/auth/send-verification-email', () => {
    test('should return 200 and send verification email to the user', async () => {
      const user = generateUser();
      await insertUsers([user]);
      const accessToken = tokenService.generateJwt(user.id);
      const sendVerificationEmailSpy = vi.spyOn(
        emailService,
        'sendVerificationEmail',
      );

      await pactum
        .spec()
        .post('/v1/auth/send-verification-email')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'If your email address is not already verified, an email is sent to verify your email address',
        });

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
        user.email,
        user.id,
      );
    });

    test("should return 200 but won't send verification email to the user if email is already verified", async () => {
      const user = generateUser();
      user.emailVerifiedAt = new Date();
      await insertUsers([user]);
      const accessToken = tokenService.generateJwt(user.id);
      const sendVerificationEmailSpy = vi.spyOn(
        emailService,
        'sendVerificationEmail',
      );

      await pactum
        .spec()
        .post('/v1/auth/send-verification-email')
        .withHeaders('Authorization', `Bearer ${accessToken}`)
        .expectStatus(httpStatus.OK)
        .expectJson({
          message:
            'If your email address is not already verified, an email is sent to verify your email address',
        });

      expect(sendVerificationEmailSpy).not.toHaveBeenCalledWith(
        user.email,
        user.id,
      );
    });

    test('should return 401 if user is not authenticated', async () => {
      await pactum
        .spec()
        .post('/v1/auth/send-verification-email')
        .expectStatus(httpStatus.UNAUTHORIZED);
    });
  });
});
