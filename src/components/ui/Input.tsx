import React from 'react';
import clsx from 'clsx';
import { useThemeStore } from '../../store/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const { isDarkMode } = useThemeStore();
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = isDarkMode
    ? 'block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
    : 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
    
  const errorClasses = error 
    ? isDarkMode
      ? 'border-red-500 text-red-300 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
    : '';
    
  const iconClasses = leftIcon ? 'pl-10' : '';
  
  const classes = clsx(baseClasses, errorClasses, iconClasses, className);
  
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={classes}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};