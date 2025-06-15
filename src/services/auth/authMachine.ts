import { AuthStateType, AuthTokens, User, LoginCredentials } from './types';

export interface AuthMachineContext {
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
  retryCount: number;
}

export type AuthMachineEvent =
  | { type: 'LOGIN'; credentials: LoginCredentials }
  | { type: 'LOGIN_SUCCESS'; user: User; tokens: AuthTokens }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'LOGOUT_FAILURE'; error: string }
  | { type: 'REFRESH' }
  | { type: 'REFRESH_SUCCESS'; tokens: AuthTokens }
  | { type: 'REFRESH_FAILURE'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CHECK_AUTH' };

export interface AuthMachineState {
  value: AuthStateType;
  context: AuthMachineContext;
}

export class AuthStateMachine {
  private state: AuthMachineState;
  private listeners: Set<(state: AuthMachineState) => void> = new Set();

  constructor(initialContext?: Partial<AuthMachineContext>) {
    this.state = {
      value: 'unauthenticated',
      context: {
        user: null,
        tokens: null,
        error: null,
        retryCount: 0,
        ...initialContext,
      },
    };

    // Check initial auth state
    if (this.state.context.tokens) {
      this.state.value = 'authenticated';
    }
  }

  getState(): AuthMachineState {
    return this.state;
  }

  subscribe(listener: (state: AuthMachineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private transition(value: AuthStateType, contextUpdate?: Partial<AuthMachineContext>): void {
    this.state = {
      value,
      context: {
        ...this.state.context,
        ...contextUpdate,
      },
    };
    this.notify();
  }

  send(event: AuthMachineEvent): void {
    const { value: currentState } = this.state;

    switch (event.type) {
      case 'LOGIN':
        if (currentState === 'unauthenticated' || currentState === 'error') {
          this.transition('authenticating', { error: null });
        }
        break;

      case 'LOGIN_SUCCESS':
        if (currentState === 'authenticating') {
          this.transition('authenticated', {
            user: event.user,
            tokens: event.tokens,
            error: null,
            retryCount: 0,
          });
        }
        break;

      case 'LOGIN_FAILURE':
        if (currentState === 'authenticating') {
          this.transition('error', {
            error: event.error,
            user: null,
            tokens: null,
          });
        }
        break;

      case 'LOGOUT':
        if (currentState === 'authenticated' || currentState === 'refreshing') {
          this.transition('unauthenticated', {
            user: null,
            tokens: null,
            error: null,
            retryCount: 0,
          });
        }
        break;

      case 'REFRESH':
        if (currentState === 'authenticated') {
          this.transition('refreshing');
        }
        break;

      case 'REFRESH_SUCCESS':
        if (currentState === 'refreshing') {
          this.transition('authenticated', {
            tokens: event.tokens,
            error: null,
            retryCount: 0,
          });
        }
        break;

      case 'REFRESH_FAILURE':
        if (currentState === 'refreshing') {
          const { retryCount } = this.state.context;
          if (retryCount < 3) {
            this.transition('refreshing', {
              error: event.error,
              retryCount: retryCount + 1,
            });
          } else {
            this.transition('unauthenticated', {
              error: 'Session expired',
              user: null,
              tokens: null,
              retryCount: 0,
            });
          }
        }
        break;

      case 'CLEAR_ERROR':
        if (currentState === 'error') {
          this.transition('unauthenticated', { error: null });
        }
        break;

      case 'CHECK_AUTH':
        // This is handled in the constructor
        break;
    }
  }

  isAuthenticated(): boolean {
    return this.state.value === 'authenticated' || this.state.value === 'refreshing';
  }

  isLoading(): boolean {
    return this.state.value === 'authenticating' || this.state.value === 'refreshing';
  }

  hasError(): boolean {
    return this.state.value === 'error';
  }
}