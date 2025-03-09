import { ReactNode } from 'react';

import './button.styles.css';

export type ButtonVariant = 'primary' | 'secondary' | 'muted' | 'dark' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ButtonProps {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    radius?: ButtonRadius;
    className?: string;
    icon?: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    fullWidth?: boolean;
    isActive?: boolean;
    hasShadow?: boolean;
    customStyles?: {
        backgroundColor?: string;
        textColor?: string;
        hoverBackgroundColor?: string;
        activeBackgroundColor?: string;
        borderColor?: string;
        gradientFrom?: string;
        gradientTo?: string;
        transitionDuration?: '200' | '300';
    };
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    radius = 'lg',
    className = '',
    icon,
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false,
    isActive = false,
    hasShadow = false,
    customStyles
}: ButtonProps) => {
    const baseClasses = 'button-base';
    const variantClasses = customStyles ? 'button-custom' : `button-${variant}`;
    const sizeClasses = `button-${size}`;
    const radiusClasses = `button-radius-${radius}`;
    const widthClasses = fullWidth ? 'w-full' : '';
    const activeClasses = isActive ? 'button-secondary-active' : '';
    const shadowClasses = hasShadow ? 'button-shadow' : '';
    const durationClass = customStyles?.transitionDuration ? `duration-${customStyles.transitionDuration}` : '';

    const style = customStyles
        ? ({
            backgroundColor: customStyles.backgroundColor,
            color: customStyles.textColor,
            borderColor: customStyles.borderColor,
            '--hover-bg': customStyles.hoverBackgroundColor,
            '--active-bg': customStyles.activeBackgroundColor,
            '--gradient-from': customStyles.gradientFrom,
            '--gradient-to': customStyles.gradientTo
        } as React.CSSProperties)
        : undefined;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${radiusClasses} ${widthClasses} ${activeClasses} ${shadowClasses} ${durationClass} ${icon && !children ? 'p-2' : ''} ${className}`}>
            {icon && <span className={`button-icon ${!children ? 'm-0' : ''}`}>{icon}</span>}
            {children}
        </button>
    );
};
