import { ReactNode } from 'react';

import './button.styles.css';

export type ButtonVariant = 'primary' | 'secondary' | 'muted' | 'dark' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ButtonStyleProps {
    backgroundColor?: string;
    textColor?: string;
    hoverBackgroundColor?: string;
    activeBackgroundColor?: string;
    borderColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    transitionDuration?: '200' | '300';
    padding?: {
        x?: string;
        y?: string;
    };
}

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
    customStyles?: ButtonStyleProps;
    /** Override default size padding. This takes precedence over customStyles.padding */
    padding?: {
        x?: string;
        y?: string;
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
    customStyles,
    padding
}: ButtonProps) => {
    const baseClasses = 'button-base';
    const variantClasses = customStyles ? 'button-custom' : `button-${variant}`;
    const sizeClasses = padding ? '' : `button-${size}`; // Skip size class if custom padding
    const radiusClasses = `button-radius-${radius}`;
    const widthClasses = fullWidth ? 'w-full' : '';
    const activeClasses = isActive ? 'button-secondary-active' : '';
    const shadowClasses = hasShadow ? 'button-shadow' : '';
    const durationClass = customStyles?.transitionDuration ? `duration-${customStyles.transitionDuration}` : '';

    // Handle padding customization
    const paddingStyles = padding || customStyles?.padding;
    const customPaddingClasses = paddingStyles ? [
        paddingStyles.x && `px-${paddingStyles.x}`,
        paddingStyles.y && `py-${paddingStyles.y}`
    ].filter(Boolean).join(' ') : '';

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
        <button type={type}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${radiusClasses} ${widthClasses} ${activeClasses} ${shadowClasses} ${durationClass} ${customPaddingClasses} ${icon && !children ? 'p-2' : ''} ${className}`}>
            {icon && <span className={`button-icon ${!children ? 'm-0' : ''}`}>{icon}</span>}
            {children}
        </button>
    );
};
