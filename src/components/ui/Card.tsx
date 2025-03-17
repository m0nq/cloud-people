import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useThemeStore } from '../../store/theme';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    onClick,
    interactive = false
}) => {
    const { isDarkMode } = useThemeStore();

    const baseClasses = isDarkMode
        ? 'bg-gray-800 text-gray-100 rounded-lg shadow-md overflow-hidden border border-gray-700'
        : 'bg-white rounded-lg shadow-md overflow-hidden';

    const interactiveClasses = interactive
        ? isDarkMode
            ? 'cursor-pointer hover:shadow-lg hover:bg-gray-750 transition-shadow duration-200'
            : 'cursor-pointer hover:shadow-lg transition-shadow duration-200'
        : '';

    const classes = clsx(baseClasses, interactiveClasses, className);

    const content = (
        <div className={classes} onClick={onClick}>
            {children}
        </div>
    );

    if (interactive && onClick) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={classes}
                onClick={onClick}
            >
                {children}
            </motion.div>
        );
    }

    return content;
};

export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={clsx(`px-6 py-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`, className)}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
    const { isDarkMode } = useThemeStore();

    return (
        <h3 className={clsx(`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`, className)}>
            {children}
        </h3>
    );
};

export const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div className={clsx('px-6 py-4', className)}>
        {children}
    </div>
);

export const CardFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={clsx(`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`, className)}>
            {children}
        </div>
    );
};