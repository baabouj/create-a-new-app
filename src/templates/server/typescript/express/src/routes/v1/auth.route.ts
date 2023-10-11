import { Router } from 'express';

import { config } from '$/config';
import { authController } from '$/controllers';
import { rateLimit } from '$/middlewares';

const authRouter = Router();

if (config.env === 'production') {
  authRouter.use(rateLimit);
}

authRouter.post('/login', authController.login);
authRouter.post('/signup', authController.signup);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

authRouter.get('/me', authController.findAuthedUser);

authRouter.post('/change-password', authController.changePassword);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);

authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post(
  '/send-verification-email',
  authController.sendVerificationEmail,
);

export { authRouter };
