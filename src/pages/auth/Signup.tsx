import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/api/api';
import { useToastStore } from '@/store/toastStore';
import AuthLayout from '@/components/auth/AuthLayout';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';

export default function Signup() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!validateName(displayName)) {
      errors.displayName = 'Name must be at least 2 characters';
    }

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      errors.terms = 'You must agree to the terms of service';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { data, error: signupError } = await authAPI.signup(email, password, displayName);

    if (signupError) {
      console.error('Signup error:', signupError);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (signupError.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      } else if (signupError.message.includes('password')) {
         errorMessage = 'Password does not meet requirements.';
      } else if (signupError.message.includes('invalid')) {
        errorMessage = 'Please use a valid email address from a real email provider.';
      }
      
      setError(errorMessage);
      addToast('error', errorMessage);
      setLoading(false);
      return;
    }

    if (data?.user) {
      addToast('success', 'Account created successfully! Please check your email to verify your account.');
      // Redirect to email verification page or login
      setTimeout(() => {
        navigate('/login?verified=pending');
      }, 1500);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join our beauty community">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-secondary transition-colors" size={20} />
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (fieldErrors.displayName) {
                  setFieldErrors(prev => ({ ...prev, displayName: '' }));
                }
              }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                fieldErrors.displayName ? 'border-red-300' : 'border-gray-200'
              } focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white`}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>
          {fieldErrors.displayName && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.displayName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-secondary transition-colors" size={20} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                fieldErrors.email ? 'border-red-300' : 'border-gray-200'
              } focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white`}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-secondary transition-colors" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
                fieldErrors.password ? 'border-red-300' : 'border-gray-200'
              } focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
          )}
          <PasswordStrengthIndicator password={password} />
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside ml-2">
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-secondary transition-colors" size={20} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
                fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'
              } focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (fieldErrors.terms) {
                  setFieldErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              className="mt-1 w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-secondary hover:underline font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-secondary hover:underline font-medium">
                Privacy Policy
              </Link>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.terms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading && <div className="spinner" />}
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-gray-600 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-secondary font-semibold hover:text-secondary-dark hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
