import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SPOONACULAR_API_KEY: z.string().min(1, 'SPOONACULAR_API_KEY is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

// Validate environment variables at runtime
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Environment variable validation failed:');
    console.error(parsed.error.format());
    throw new Error(
      `Missing or invalid environment variables: ${parsed.error.issues
        .map((e: { path: (string | number)[] }) => e.path.join('.'))
        .join(', ')}`
    );
  }

  return parsed.data;
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>;