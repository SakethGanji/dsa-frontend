// Determine API URL based on hostname
const getApiBaseUrl = (): string => {
  // First check if environment variable is set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
  }
  
  return 'https://api.example.com/api';
};

export const env = {
  API_BASE_URL: getApiBaseUrl(),
} as const;

export type Env = typeof env;