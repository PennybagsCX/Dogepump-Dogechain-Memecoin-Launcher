/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Manages user sessions, JWT tokens, and auto-refresh functionality.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import backendService, { UserProfile, LoginRequest, RegisterRequest } from '../services/backendService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (backendService.isAuthenticated()) {
          // Try to fetch current user profile
          const currentUser = await backendService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        // Token might be expired, clear auth
        backendService.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-refresh token before expiry (5 minutes before expiry)
  useEffect(() => {
    if (!user) return;

    const refreshTokenInterval = setInterval(async () => {
      try {
        const refreshToken = backendService.getRefreshToken();
        if (refreshToken) {
          await backendService.refreshAccessToken(refreshToken);
          // Fetch updated user data
          const currentUser = await backendService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
        // Clear auth on refresh failure
        backendService.clearAuth();
        setUser(null);
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => clearInterval(refreshTokenInterval);
  }, [user]);

  const login = useCallback(async (data: LoginRequest) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await backendService.login(data);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await backendService.register(data);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await backendService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails, clear local auth state
      setUser(null);
      backendService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await backendService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If refresh fails, user might need to re-authenticate
      setUser(null);
      backendService.clearAuth();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
