import { 
  createContext, 
  useContext, 
  useState, 
  useEffect
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthState, AuthTokens } from '../../types/auth';
import {
  getStoredTokens, 
  saveTokens, 
  removeTokens, 
  getUserFromToken, 
  isTokenExpired 
} from '../../lib/auth';
import { useNavigate } from '@tanstack/react-router';

interface AuthContextType extends AuthState {
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

const initialAuthState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedTokens = getStoredTokens();
      
      if (!storedTokens || isTokenExpired(storedTokens.access_token)) {
        setAuthState({
          ...initialAuthState,
          isLoading: false
        });
        return;
      }
      
      const user = getUserFromToken(storedTokens.access_token);
      
      if (!user) {
        removeTokens();
        setAuthState({
          ...initialAuthState,
          isLoading: false
        });
        return;
      }
      
      setAuthState({
        user,
        tokens: storedTokens,
        isAuthenticated: true,
        isLoading: false
      });
    };
    
    initAuth();
  }, []);

  // Login function
  const login = (tokens: AuthTokens) => {
    saveTokens(tokens);
    
    const user = getUserFromToken(tokens.access_token);
    
    if (!user) {
      removeTokens();
      setAuthState({
        ...initialAuthState,
        isLoading: false
      });
      return;
    }
    
    // Only set the state here. Navigation will be handled by an effect.
    setAuthState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false
    });
  };

  // Logout function
  const logout = () => {
    removeTokens();
    
    // Reset auth state
    setAuthState({
      ...initialAuthState,
      isLoading: false
    });
    
    // Clear all queries from the cache
    queryClient.clear();
    
    // Redirect to login page
    navigate({ to: '/login' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

