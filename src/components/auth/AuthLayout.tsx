import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scale-in">
        <Link to="/" className="block text-center mb-6">
          <h1 className="text-3xl font-bold text-secondary">BeautyHub</h1>
        </Link>
        
        <h2 className="text-3xl font-bold text-center mb-2 text-secondary">{title}</h2>
        {subtitle && (
          <p className="text-gray-500 text-center mb-8">{subtitle}</p>
        )}
        
        {children}
      </div>
    </div>
  );
}
