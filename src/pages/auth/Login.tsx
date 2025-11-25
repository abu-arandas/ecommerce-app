import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/api/api';
import { useAuthStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import AuthLayout from '@/components/auth/AuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show messages based on query params
    const verified = searchParams.get('verified');
    const reset = searchParams.get('reset');
    
    if (verified === 'true') {
      addToast('success', 'Email verified successfully! You can now log in.');
    } else if (verified === 'pending') {
      addToast('info', 'Please check your email to verify your account before logging in.');
    }
    
    if (reset === 'true') {
      addToast('success', 'Password updated successfully! Please log in with your new password.');
    }
  }, [searchParams, addToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: loginError } = await authAPI.login(email, password);

    if (loginError) {
      console.error('Login error:', loginError);
      
      let errorMessage = 'Invalid login credentials';
      
      if (loginError.message.includes('Email not confirmed')) {
        errorMessage = 'Email not verified. Please check your inbox to verify your email.';
        addToast('warning', errorMessage);
      } else if (loginError.message.includes('Invalid')) {
        errorMessage = 'Invalid email or password. Please try again.';
        addToast('error', errorMessage);
      } else {
        addToast('error', loginError.message);
      }
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (data?.user) {
      setUser(data.user);
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      addToast('success', `Welcome back, ${data.user.user_metadata?.display_name || 'there'}!`);
      
      // Small delay to show the success message
      setTimeout(() => {
        navigate('/');
      }, 800);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await authAPI.signInWithGoogle();
    if (error) {
      setError(error.message);
      addToast('error', 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-secondary hover:text-secondary-dark font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-secondary transition-colors" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-white/50 hover:bg-white"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading && <div className="spinner" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="my-8 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm font-medium">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            className="text-[#4285F4]"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            className="text-[#34A853]"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            className="text-[#FBBC05]"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            className="text-[#EA4335]"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-gray-600 mt-8">
        Don't have an account?{' '}
        <Link to="/signup" className="text-secondary font-semibold hover:text-secondary-dark hover:underline transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
