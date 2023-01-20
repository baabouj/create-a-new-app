import { createCipheriv, createDecipheriv, createHash } from 'crypto';

import { config } from '../config';

const algorithm = 'aes-192-cbc';

const key = Buffer.from(
  createHash('sha256')
    .update(config.encryption.key)
    .digest('base64url')
    .substring(0, 32),
  'base64url'
);

const iv = Buffer.alloc(16, 0); // Initialization crypto vector

const encrypt = (text: string) => {
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');
  return encrypted;
};

const decrypt = (text: string) => {
  try {
    const decipher = createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(text, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
};

export { decrypt, encrypt };
