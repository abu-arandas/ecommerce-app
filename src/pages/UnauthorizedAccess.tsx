import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/store';

export default function UnauthorizedAccess() {
  const { user, role } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-6">
          {user ? (
            <>
              You don't have permission to access this page. This area is restricted to administrators only.
            </>
          ) : (
            <>
              Please log in to access this page.
            </>
          )}
        </p>

        {user && role && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p className="text-gray-500 mb-1">Current Role:</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              role === 'admin' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <Home size={20} />
            Go Home
          </Link>
          
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all border border-gray-200"
            >
              <LogIn size={20} />
              Sign In
            </Link>
          )}
        </div>

        {user && (
          <p className="text-sm text-gray-500 mt-6">
            If you believe this is an error, please contact an administrator.
          </p>
        )}
      </div>
    </div>
  );
}
