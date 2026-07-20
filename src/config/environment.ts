import type { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export type NodeEnvironment = 'development' | 'production' | 'test';

export interface CommonEnvironment {
  NODE_ENV: NodeEnvironment;
  DATABASE_URI: string;
  PORT: number;
  REDIS_HOST: string;
  REDIS_PORT: number;
  BULL_PREFIX: string;
}

export interface ApiEnvironment extends CommonEnvironment {
  PORT: number;
  PASSWORD_HASH_ROUNDS: number;
}

export interface WorkerEnvironment extends CommonEnvironment {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  MAIL_FROM_NAME: string;
  MAIL_FROM_ADDRESS: string;
}

const commonEnvironmentSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DATABASE_URI: Joi.string().uri().required().trim(),
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().required(),
  BULL_PREFIX: Joi.string().required(),
});

export const apiEnvironmentSchema = commonEnvironmentSchema.keys({
  PORT: Joi.number().port().required().default(3000),
  PASSWORD_HASH_ROUNDS: Joi.number().required().default(12).max(15).min(12),
});

export const workerEnvironmentSchema = commonEnvironmentSchema.keys({
  PORT: Joi.number().port().required().default(3001),
  SMTP_HOST: Joi.string().hostname().required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_SECURE: Joi.boolean().required(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  MAIL_FROM_NAME: Joi.string().required(),
  MAIL_FROM_ADDRESS: Joi.string().email().required(),
});

const validationOptions: Joi.ValidationOptions = {
  abortEarly: true,
  allowUnknown: true,
  convert: true,
};

export const baseConfigOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  expandVariables: true,
  validationOptions: validationOptions,
};

export const apiConfigOptions: ConfigModuleOptions = {
  ...baseConfigOptions,
  validationSchema: apiEnvironmentSchema,
};

export const workerConfigOptions: ConfigModuleOptions = {
  ...baseConfigOptions,
  validationSchema: workerEnvironmentSchema,
};
