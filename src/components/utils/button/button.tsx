import { ReactNode } from 'react';

import './button.styles.css';

export type ButtonVariant = 'primary' | 'secondary' | 'muted';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    icon?: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    fullWidth?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    icon,
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false
}: ButtonProps) => {
    const baseClasses = 'button-base';
    const variantClasses = `button-${variant}`;
    const sizeClasses = `button-${size}`;
    const widthClasses = fullWidth ? 'w-full' : '';

    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${className}`}>
            {icon && <span className="button-icon">{icon}</span>}
            {children}
        </button>
    );
};
