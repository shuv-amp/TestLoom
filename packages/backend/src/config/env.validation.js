const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT access token secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh token secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  UPLOAD_MAX_SIZE: z.string().transform((val) => parseInt(val, 10)).default('10485760'), // 10MB
  GEMINI_API_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.errors);
    process.exit(1);
  }
}

module.exports = { validateEnv, envSchema };
