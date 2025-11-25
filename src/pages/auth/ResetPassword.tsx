import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '@/api/api';
import { useToastStore } from '@/store/toastStore';
import AuthLayout from '@/components/auth/AuthLayout';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { validatePassword } from '@/utils/validation';

export default function ResetPassword() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { error: updateError } = await authAPI.updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      addToast('error', 'Failed to update password');
      setLoading(false);
    } else {
      addToast('success', 'Password updated successfully!');
      setTimeout(() => {
        navigate('/login?reset=true');
      }, 1500);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new strong password">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
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
              minLength={8}
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
            Confirm New Password
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
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
          )}
          {password && confirmPassword && password === confirmPassword && (
            <div className="flex items-center gap-1 mt-2 text-green-600 text-xs">
              <CheckCircle size={14} />
              <span>Passwords match</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading && <div className="spinner" />}
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
