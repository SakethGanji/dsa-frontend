import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  // Get raw environment variables
  const rawEnv = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  };

  try {
    // Validate the environment variables
    const parsed = envSchema.parse(rawEnv);
    
    return {
      API_BASE_URL: parsed.VITE_API_BASE_URL || getDefaultApiUrl(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:', error.flatten().fieldErrors);
      throw new Error('Invalid environment variables. Please check your .env file.');
    }
    throw error;
  }
};

// Determine default API URL based on hostname
const getDefaultApiUrl = (): string => {
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
  }
  
  // In production, this should fail if VITE_API_BASE_URL is not set
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_BASE_URL must be set in production environment');
  }
  
  return 'https://api.example.com/api';
};

// Export validated environment variables
export const env = parseEnv();

// Export type for TypeScript
export type Env = typeof env;

// Development helper to log environment
if (import.meta.env.DEV) {
  console.log('🔧 Environment:', {
    API_BASE_URL: env.API_BASE_URL,
    MODE: import.meta.env.MODE,
  });
}