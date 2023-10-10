import { Router } from 'express';

import { config } from '$/config';
import { authController } from '$/controllers';
import { auth, rateLimit, validate } from '$/middlewares';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from '$/validations';

const authRouter = Router();

if (config.env === 'production') {
  authRouter.use(rateLimit);
}

authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/signup', validate(signupSchema), authController.signup);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', auth, authController.logout);

authRouter.get('/me', auth, authController.findAuthedUser);

authRouter.post(
  '/change-password',
  auth,
  validate(changePasswordSchema),
  authController.changePassword,
);
authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRouter.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail,
);
authRouter.post(
  '/send-verification-email',
  auth,
  authController.sendVerificationEmail,
);

export { authRouter };
