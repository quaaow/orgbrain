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
  // Opt-in schema auto-sync; keep off everywhere except a throwaway dev DB.
  DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),

  QDRANT_URL: notPlaceholder('QDRANT_URL'),
  QDRANT_API_KEY: Joi.string().required(),
  QDRANT_COLLECTION: Joi.string().default('orgbrain_knowledge'),

  OPENROUTER_API_KEY: Joi.string().required(),

  CHAT_MODEL: Joi.string().default('deepseek/deepseek-chat:free'),
  EMBEDDING_MODEL: Joi.string().default('local'),

  APP_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  SECRET_KEY: Joi.string().required(),

  PORT: Joi.number().default(8000),

  // Optional comma-separated CORS allow-list (e.g. https://app.example.com).
  CORS_ORIGINS: Joi.string().optional().allow(''),
  // Per-org daily Reflect cap (LLM cost guard). 0 disables the limit.
  REFLECT_DAILY_LIMIT: Joi.number().integer().min(0).default(50),
});
