const TOKEN_TYPES = {
  REFRESH: 'REFRESH',
  RESET_PASSWORD: 'RESET_PASSWORD',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
} as const;

type TokenType = keyof typeof TOKEN_TYPES;

export { TOKEN_TYPES, TokenType };
