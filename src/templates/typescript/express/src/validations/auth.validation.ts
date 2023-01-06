import { z } from 'zod';

import { exclu } from '$/utils';

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
};

const signupSchema = {
  body: z
    .object({
      name: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(8),
      confirm: z.string().min(8),
    })
    .refine((data) => data.password === data.confirm, {
      message: "passwords don't match",
      path: ['confirm'],
    })
    .transform((data) => exclu(data, ['confirm'])),
};

const changePasswordSchema = {
  body: z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

const resetPasswordSchema = {
  query: z.object({
    token: z.string(),
  }),
  body: z.object({
    password: z.string().min(8),
  }),
};

const verifyEmailSchema = {
  query: z.object({
    token: z.string(),
  }),
};

type SignupBody = z.infer<typeof signupSchema.body>;

export {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  SignupBody,
  signupSchema,
  verifyEmailSchema,
};
