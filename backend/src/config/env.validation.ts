import * as Joi from 'joi';

const notPlaceholder = (label: string) =>
  Joi.string()
    .required()
    .custom((value: string, helpers) => {
      if (!value || value.trim() === '' || value.includes('placeholder')) {
        return helpers.error('any.invalid');
      }
      return value;
    }, `${label} placeholder check`)
    .messages({ 'any.invalid': `${label} must be set to a real value` });

export const envValidationSchema = Joi.object({
  SUPABASE_URL: notPlaceholder('SUPABASE_URL'),
  SUPABASE_KEY: Joi.string().required(),

  DATABASE_URL: notPlaceholder('DATABASE_URL'),

  QDRANT_URL: notPlaceholder('QDRANT_URL'),
  QDRANT_API_KEY: Joi.string().required(),

  OPENROUTER_API_KEY: Joi.string().required(),

  CHAT_MODEL: Joi.string().default('deepseek/deepseek-chat:free'),
  EMBEDDING_MODEL: Joi.string().default('local'),

  APP_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  SECRET_KEY: Joi.string().required(),

  PORT: Joi.number().default(8000),
});
