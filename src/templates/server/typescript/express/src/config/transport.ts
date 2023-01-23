import nodemailer from 'nodemailer';

import { config } from './config';

let transport = nodemailer.createTransport(config.email.smtp);

if (config.env === 'test') {
  const account = await nodemailer.createTestAccount();

  transport = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
}

export { transport };
