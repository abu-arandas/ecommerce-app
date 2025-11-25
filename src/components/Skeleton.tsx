import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ 
  variant = 'rectangular', 
  width, 
  height, 
  className = '' 
}: SkeletonProps) {
  const baseClasses = 'skeleton animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const cssVariables = {
    '--skeleton-width': typeof width === 'number' ? `${width}px` : width,
    '--skeleton-height': typeof height === 'number' ? `${height}px` : (height || (variant === 'text' ? '1rem' : undefined)),
  } as React.CSSProperties;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={cssVariables}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card">
      <Skeleton variant="rectangular" height={256} className="mb-4" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="60%" className="mb-3" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <Skeleton variant="rectangular" height={384} className="mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton variant="text" width="70%" height={40} className="mb-4" />
        <Skeleton variant="text" width="40%" height={32} className="mb-6" />
        <Skeleton variant="text" width="100%" className="mb-2" />
        <Skeleton variant="text" width="100%" className="mb-2" />
        <Skeleton variant="text" width="80%" className="mb-6" />
        <Skeleton variant="rectangular" width="100%" height={48} />
      </div>
    </div>
  );
}
