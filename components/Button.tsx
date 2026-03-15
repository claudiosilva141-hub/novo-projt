import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center font-medium rounded-md transition-colors duration-200';
  let variantStyles = '';
  let sizeStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      break;
    case 'outline':
      variantStyles = 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400';
      break;
    case 'ghost':
      variantStyles = 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300';
      break;
  }

  switch (size) {
    case 'sm':
      sizeStyles = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyles = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyles = 'px-5 py-2.5 text-lg';
      break;
  }

  const disabledStyles = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles} ${className || ''} focus:outline-none focus:ring-2 focus:ring-offset-2`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="h-5 w-5" color="text-white" />
      ) : (
        <>
          {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};