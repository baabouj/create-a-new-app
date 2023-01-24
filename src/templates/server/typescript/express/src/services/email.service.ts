import { config, transport } from '$/config';

import * as tokenService from './token.service';

const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

const sendResetPasswordEmail = async (to: string, userId: string) => {
  const subject = 'Password Reset';
  const token = await tokenService.generateResetPasswordToken(userId);
  const resetPasswordUrl = `${config.resetPasswordToken.frontendPageUrl}?token=${token}`;
  const html = `<body>
    <p>Please reset your password</p>
    <a href="${resetPasswordUrl}">Reset Password</a>
    <p>If you did not request for a password reset, then please ignore this email.</p>
  </body>`;
  await sendEmail(to, subject, html);
};

const sendVerificationEmail = async (to: string, userId: string) => {
  const subject = 'Email Verification';
  const token = await tokenService.generateEmailVerificationToken(userId);
  const verificationEmailUrl = `${config.emailVerificationToken.frontendPageUrl}?token=${token}`;
  const html = `<body>
    <p>Please verify your email</p>
    <a href="${verificationEmailUrl}">Verify Email</a>
    <p>If you did not create an user or asked for an email verification, then please ignore this email.</p>
  </body>`;
  await sendEmail(to, subject, html);
};

export { sendEmail, sendResetPasswordEmail, sendVerificationEmail };
