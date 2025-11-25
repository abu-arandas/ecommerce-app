import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/api/api';
import { useToastStore } from '@/store/toastStore';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: resetError } = await authAPI.resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      addToast('error', 'Failed to send reset link. Please try again.');
    } else {
      setMessage(`Password reset link sent to ${email}`);
      setEmailSent(true);
      addToast('success', 'Password reset link sent! Check your email.');
      
      // Start resend timer (60 seconds)
      setCanResend(false);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    const { error: resetError } = await authAPI.resetPassword(email);
    if (!resetError) {
      addToast('success', 'Reset link resent successfully!');
      
      // Restart timer
      setCanResend(false);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      addToast('error', 'Failed to resend link');
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
      <Link to="/login" className="inline-flex items-center text-gray-500 hover:text-secondary mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Back to Login
      </Link>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm border border-green-100 animate-fade-in">
          <p className="font-medium">{message}</p>
          <p className="mt-2 text-xs">Please check your inbox and spam folder.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={emailSent}
            />
          </div>
        </div>

        {!emailSent ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading && <div className="spinner" />}
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="spinner" />}
              {canResend ? 'Resend Email' : `Resend in ${resendTimer}s`}
            </button>
            <p className="text-center text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        )}
      </form>

      {emailSent && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Next steps:</strong>
          </p>
          <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>Check your email inbox</li>
            <li>Click the reset link in the email</li>
            <li>Create a new strong password</li>
            <li>Log in with your new password</li>
          </ol>
        </div>
      )}
    </AuthLayout>
  );
}
