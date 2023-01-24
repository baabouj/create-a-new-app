import argon from 'argon2';

const make = (plain: string) => {
  return argon.hash(plain);
};
const verify = (hash: string, plain: string) => {
  return argon.verify(hash, plain);
};

export const hash = { make, verify };
