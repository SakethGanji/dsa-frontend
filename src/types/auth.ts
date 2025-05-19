export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  sub: string; // username from JWT
  role_id: number; // from JWT
  exp?: number;    // expiration from JWT
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Default export for compatibility
const AuthTypes = {
  AuthTokens: {} as AuthTokens,
  User: {} as User,
  LoginCredentials: {} as LoginCredentials,
  AuthState: {} as AuthState
};

export default AuthTypes;