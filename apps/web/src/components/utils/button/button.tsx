import { ReactNode } from 'react';

import './button.styles.css';

export type ButtonVariant = 'primary' | 'secondary' | 'muted' | 'dark' | 'gradient' | 'bare';
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
    /** When true, the button will not apply fixed height constraints */
    noFixedHeight?: boolean;
    /** When true, allows className to override internal styles */
    overrideStyles?: boolean;
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
    padding,
    noFixedHeight = false,
    overrideStyles = false
}: ButtonProps) => {
    // Base classes that should always be applied
    const baseClasses = 'button-base';
    
    // Variant classes
    const variantClasses = customStyles ? 'button-custom' : `button-${variant}`;
    
    // Size classes - skip if noFixedHeight is true or custom padding is provided
    const sizeClasses = (noFixedHeight || padding) ? '' : `button-${size}`;
    
    // Other feature classes
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

    // Determine final class string based on overrideStyles flag
    const buttonClasses = overrideStyles
        ? `${baseClasses} ${className}`
        : `${baseClasses} ${variantClasses} ${sizeClasses} ${radiusClasses} ${widthClasses} ${activeClasses} ${shadowClasses} ${durationClass} ${customPaddingClasses} ${className}`;

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
            className={buttonClasses}>
            {icon && <span className={`button-icon ${!children ? 'm-0' : ''}`}>{icon}</span>}
            {children}
        </button>
    );
};
