import { getStoredTokens, isTokenExpired, refreshAccessToken, removeTokens } from '../../auth';

interface TokenManagerConfig {
  onAuthError?: () => void;
  storage?: Storage;
}

export class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private config: TokenManagerConfig;

  constructor(config: TokenManagerConfig = {}) {
    this.config = {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      ...config,
    };
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const tokens = getStoredTokens();
    
    if (!tokens) {
      throw new Error('Authentication required');
    }

    if (isTokenExpired(tokens.access_token)) {
      await this.refreshToken();
      
      const freshTokens = getStoredTokens();
      if (!freshTokens) {
        throw new Error('Authentication required');
      }
      
      return { Authorization: `Bearer ${freshTokens.access_token}` };
    }
    
    return { Authorization: `Bearer ${tokens.access_token}` };
  }

  private async refreshToken(): Promise<void> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshPromise = this.performRefresh().finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });
    }
    
    if (this.refreshPromise) {
      await this.refreshPromise;
    }
  }

  private async performRefresh(): Promise<void> {
    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error('No refresh token available');
      }
      
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      
      if (this.config.storage) {
        this.config.storage.setItem('auth_tokens', JSON.stringify(newTokens));
      }
    } catch {
      removeTokens();
      this.config.onAuthError?.();
      throw new Error('Session expired. Please login again.');
    }
  }

  clearTokens(): void {
    removeTokens();
  }

  isAuthenticated(): boolean {
    const tokens = getStoredTokens();
    return !!tokens && !isTokenExpired(tokens.access_token);
  }
}

export const tokenManager = new TokenManager({
  onAuthError: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});