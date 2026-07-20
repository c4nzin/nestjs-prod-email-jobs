type Environment = Record<string, unknown>;

const COMMON_REQUIRED = [
  'DATABASE_URI',
  'REDIS_HOST',
  'REDIS_PORT',
  'BULL_PREFIX',
] as const;
const SMTP_REQUIRED = [
  'SMTP_HOST',
  'SMTP_PORT',
  'MAIL_FROM_NAME',
  'MAIL_FROM_ADDRESS',
] as const;

export function validateApiEnvironment(config: Environment): Environment {
  validateRequired(config, COMMON_REQUIRED);
  validateNumbers(config, ['PORT', 'REDIS_PORT', 'PASSWORD_HASH_ROUNDS']);
  return config;
}

export function validateWorkerEnvironment(config: Environment): Environment {
  validateRequired(config, [...COMMON_REQUIRED, ...SMTP_REQUIRED]);
  validateNumbers(config, ['REDIS_PORT', 'SMTP_PORT']);
  if (config.SMTP_USER && !config.SMTP_PASSWORD && !config.SMTP_PASS) {
    throw new Error('SMTP_PASSWORD is required when SMTP_USER is set');
  }
  return config;
}

function validateRequired(config: Environment, keys: readonly string[]): void {
  const missing = keys.filter((key) => !String(config[key] ?? '').trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

function validateNumbers(config: Environment, keys: string[]): void {
  for (const key of keys) {
    if (config[key] === undefined || config[key] === '') continue;
    const value = Number(config[key]);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
  }
}
