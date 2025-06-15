import { AuthTokens } from './types';

const AUTH_TOKENS_KEY = 'auth_tokens';
const AUTH_USER_KEY = 'auth_user';

export class AuthStorage {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  getTokens(): AuthTokens | null {
    try {
      const tokensString = this.storage.getItem(AUTH_TOKENS_KEY);
      if (!tokensString) return null;
      
      return JSON.parse(tokensString) as AuthTokens;
    } catch (error) {
      console.error('Failed to parse auth tokens:', error);
      return null;
    }
  }

  setTokens(tokens: AuthTokens): void {
    try {
      this.storage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store auth tokens:', error);
    }
  }

  removeTokens(): void {
    this.storage.removeItem(AUTH_TOKENS_KEY);
  }

  getUser<T = any>(): T | null {
    try {
      const userString = this.storage.getItem(AUTH_USER_KEY);
      if (!userString) return null;
      
      return JSON.parse(userString) as T;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  setUser<T = any>(user: T): void {
    try {
      this.storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  removeUser(): void {
    this.storage.removeItem(AUTH_USER_KEY);
  }

  clear(): void {
    this.removeTokens();
    this.removeUser();
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) return false;
      
      const now = Date.now() / 1000;
      return now >= exp - 60; // Consider expired 60 seconds before actual expiry
    } catch (error) {
      console.error('Failed to decode token:', error);
      return true;
    }
  }

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.access_token || null;
  }

  getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refresh_token || null;
  }

  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    
    return !this.isTokenExpired(accessToken);
  }
}

// Export singleton instance
export const authStorage = new AuthStorage();