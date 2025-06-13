import type { AuthTokens, User } from '../types/auth';
import { env } from '../config/env';

const AUTH_STORAGE_KEY = 'auth_tokens';
const API_BASE_URL = env.API_BASE_URL;

// Save tokens to localStorage
export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

// Get tokens from localStorage
export function getStoredTokens(): AuthTokens | null {
  const tokensStr = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!tokensStr) return null;
  
  try {
    return JSON.parse(tokensStr) as AuthTokens;
  } catch (error) {
    console.error('Failed to parse stored tokens:', error);
    return null;
  }
}

// Remove tokens from localStorage
export function removeTokens(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Custom JWT decode function
function decodeJwt<T>(token: string): T {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw new Error('Invalid token');
  }
}

// Extract user info from access token
export function getUserFromToken(token: string): User | null {
  try {
    return decodeJwt<User>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Check if access token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJwt<{ exp: number }>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

// Login API call
export async function loginUser(username: string, password: string): Promise<AuthTokens> {
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('username', username);
  formData.append('password', password);
  formData.append('scope', '');
  formData.append('client_id', '');
  formData.append('client_secret', '');

  const response = await fetch(`${API_BASE_URL}/users/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Login failed: ${response.status} ${response.statusText}`);
  }

  const tokens = await response.json();
  return tokens;
}

// Refresh token API call
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/users/token/refresh?refresh_token=${refreshToken}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Token refresh failed: ${response.status} ${response.statusText}`);
  }

  const tokens = await response.json();
  return tokens;
}