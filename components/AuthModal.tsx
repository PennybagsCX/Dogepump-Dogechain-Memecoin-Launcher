/**
 * AuthModal Component
 * 
 * Provides login and registration functionality in a modal dialog.
 * Handles form validation, error display, and authentication flow.
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, register, isLoading, error, clearError } = useAuth();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setFormData({ email: '', username: '', password: '' });
      setErrors({});
      clearError();
    }
  }, [isOpen, defaultMode, clearError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Username validation (only for register)
    if (mode === 'register') {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (formData.username.length > 20) {
        newErrors.username = 'Username must be less than 20 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        });
      }
      onClose();
    } catch (err) {
      // Error is already set in AuthContext
      console.error('Auth failed:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === 'login'
              ? 'Login to upload images and comment'
              : 'Join the community today'}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className={`w-full bg-white/[0.03] border ${
                  errors.email ? 'border-red-500/50' : 'border-white/10'
                } rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-doge/50 outline-none transition-all`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-red-400 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Username field (register only) */}
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-username" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="YourUsername"
                  className={`w-full bg-white/[0.03] border ${
                    errors.username ? 'border-red-500/50' : 'border-white/10'
                  } rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-doge/50 outline-none transition-all`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-red-400 text-xs">{errors.username}</p>
              )}
            </div>
          )}

          {/* Password field */}
          <div>
            <label htmlFor="auth-password" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full bg-white/[0.03] border ${
                  errors.password ? 'border-red-500/50' : 'border-white/10'
                } rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-600 focus:border-doge/50 outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-400 text-xs">{errors.password}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-bold uppercase tracking-wider"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        {/* Mode switch */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrors({});
                clearError();
              }}
              className="text-doge hover:text-doge-light font-bold transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AuthModal;
