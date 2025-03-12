import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import './card.styles.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
    variant?: 'light' | 'dark';
}

export const Card = ({
    children,
    className,
    onClick,
    interactive = false,
    variant = 'light'
}: CardProps) => {
    const cardClasses = clsx(
        'card',
        variant === 'dark' && 'card-dark',
        interactive && 'card-interactive',
        interactive && variant === 'dark' && 'card-interactive-dark',
        className
    );

    const content = (
        <div className={cardClasses} onClick={onClick}>
            {children}
        </div>
    );

    if (interactive && onClick) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cardClasses}
                onClick={onClick} >
                {children}
            </motion.div>
        );
    }

    return content;
};

interface CardSectionProps {
    className?: string;
    children: React.ReactNode;
    variant?: 'light' | 'dark';
}

export const CardHeader = ({ className, children, variant = 'light' }: CardSectionProps) => {
    return (
        <div className={clsx(
            'card-header',
            variant === 'dark' ? 'card-header-dark' : 'card-header-light',
            className
        )}>
            {children}
        </div>
    );
};

export const CardTitle = ({ className, children, variant = 'light' }: CardSectionProps) => {
    return (
        <h3 className={clsx(
            'card-title',
            variant === 'dark' ? 'card-title-dark' : 'card-title-light',
            className
        )}>
            {children}
        </h3>
    );
};

export const CardContent = ({ className, children }: CardSectionProps) => (

    <div className={clsx('card-content', className)}>
        {children}
    </div>
);

export const CardFooter = ({ className, children, variant = 'light' }: CardSectionProps) => {
    return (
        <div className={clsx(
            'card-footer',
            variant === 'dark' ? 'card-footer-dark' : 'card-footer-light',
            className
        )}>
            {children}

        </div>
    );
};
