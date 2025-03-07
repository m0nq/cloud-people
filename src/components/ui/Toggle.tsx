import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useThemeStore } from '../../store/theme';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle: React.FC<ToggleProps> = ({
  isOn,
  onToggle,
  label,
  disabled = false,
  size = 'md',
}) => {
  const { isDarkMode } = useThemeStore();
  
  const sizeClasses = {
    sm: {
      toggle: 'w-8 h-4',
      circle: 'w-3 h-3',
      translate: isOn ? 'translate-x-4' : 'translate-x-1',
    },
    md: {
      toggle: 'w-11 h-6',
      circle: 'w-5 h-5',
      translate: isOn ? 'translate-x-5' : 'translate-x-1',
    },
    lg: {
      toggle: 'w-14 h-7',
      circle: 'w-6 h-6',
      translate: isOn ? 'translate-x-7' : 'translate-x-1',
    },
  };
  
  const currentSize = sizeClasses[size];
  
  return (
    <div className="flex items-center">
      {label && (
        <span className={`mr-3 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{label}</span>
      )}
      <button
        type="button"
        className={clsx(
          'relative inline-flex flex-shrink-0 rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          currentSize.toggle,
          isOn ? 'bg-blue-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
          isDarkMode && 'focus:ring-offset-gray-800'
        )}
        role="switch"
        aria-checked={isOn}
        onClick={disabled ? undefined : onToggle}
      >
        <span className="sr-only">Toggle</span>
        <span
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none inline-block rounded-full bg-white shadow transition-transform ease-in-out duration-200',
            currentSize.circle,
            currentSize.translate
          )}
        />
      </button>
    </div>
  );
};