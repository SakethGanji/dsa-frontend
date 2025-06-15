import { apiClient } from '../../lib/api/core';
import { AuthenticationError } from '../../lib/api/core/errors';
import { tokenManager } from '../../lib/api/core/tokenManager';
import { AuthStateMachine } from './authMachine';
import { authStorage } from './authStorage';
import type { AuthTokens, User, LoginCredentials } from './types';

export class AuthService {
  private stateMachine: AuthStateMachine;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize state machine with stored tokens
    const tokens = authStorage.getTokens();
    const user = authStorage.getUser<User>();
    
    this.stateMachine = new AuthStateMachine({
      tokens,
      user,
    });

    // Set up automatic token refresh
    if (tokens) {
      this.scheduleTokenRefresh();
    }
  }

  getStateMachine(): AuthStateMachine {
    return this.stateMachine;
  }

  async login(credentials: LoginCredentials): Promise<void> {
    this.stateMachine.send({ type: 'LOGIN', credentials });

    try {
      const response = await apiClient.post<{
        user: User;
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in?: number;
      }>('/auth/login', credentials);

      const tokens: AuthTokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
      };

      // Store tokens and user
      authStorage.setTokens(tokens);
      authStorage.setUser(response.user);

      // Update state machine
      this.stateMachine.send({
        type: 'LOGIN_SUCCESS',
        user: response.user,
        tokens,
      });

      // Schedule token refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.stateMachine.send({ type: 'LOGIN_FAILURE', error: message });
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.stateMachine.send({ type: 'LOGOUT' });

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    try {
      // Call logout endpoint if available
      await apiClient.post('/auth/logout').catch(() => {
        // Ignore logout endpoint errors
      });
    } finally {
      // Clear local storage
      authStorage.clear();
      tokenManager.clearTokens();
      
      this.stateMachine.send({ type: 'LOGOUT_SUCCESS' });
    }
  }

  async refreshTokens(): Promise<void> {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    this.stateMachine.send({ type: 'REFRESH' });

    try {
      const response = await apiClient.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      // Store new tokens
      authStorage.setTokens(response);

      // Update state machine
      this.stateMachine.send({
        type: 'REFRESH_SUCCESS',
        tokens: response,
      });

      // Reschedule token refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      this.stateMachine.send({ type: 'REFRESH_FAILURE', error: message });
      
      // If refresh fails, logout
      if (this.stateMachine.getState().context.retryCount >= 3) {
        await this.logout();
      }
      
      throw error;
    }
  }

  private scheduleTokenRefresh(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const accessToken = authStorage.getAccessToken();
    if (!accessToken) return;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) return;
      
      // Refresh 5 minutes before expiry
      const now = Date.now() / 1000;
      const timeUntilRefresh = (exp - now - 300) * 1000;
      
      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshTokens().catch(error => {
            console.error('Automatic token refresh failed:', error);
          });
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error('Failed to schedule token refresh:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.stateMachine.getState().context.user;
  }

  isAuthenticated(): boolean {
    return this.stateMachine.isAuthenticated();
  }

  clearError(): void {
    this.stateMachine.send({ type: 'CLEAR_ERROR' });
  }
}

// Export singleton instance
export const authService = new AuthService();