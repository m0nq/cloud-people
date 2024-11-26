import flowbite from 'flowbite/plugin';
import defaultTheme from 'tailwindcss/defaultTheme';
import { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        fontFamily: {
            sans: ['var(--font-family-dm-sans)', ...defaultTheme.fontFamily.sans],
            lexend: ['var(--font-family-lexend)', ...defaultTheme.fontFamily.sans],
            inter: ['var(--font-family-inter)', ...defaultTheme.fontFamily.sans]
        },
        extend: {
            colors: {
                // Brand colors
                primary: '#6652ff',
                secondary: '#56e8cd',
                
                // Navigation
                'nav-border': '#3D3D3D',
                'nav-bg': '#181A1A',
                'nav-text': '#bac5d1',
                
                // Text colors
                'text-primary': '#515568',
                'text-secondary': '#BEC1CF',
                'text-meta': '#9D9D9D',
                'text-light': '#E1E1EE',
                
                // UI Elements
                'icon-gray': '#818181',
                'border-light': '#DBDBDB',
                dark: '#131414',
                
                // Login specific
                'login-bg': '#56E8CD',
                'login-text': '#18642D',
                'login-button': '#614CFF',
                'login-button-hover': 'rgba(97, 76, 255, 0.4)',
                
                // Gradients (to be used with bg-gradient-to-r)
                'gradient-purple': {
                    from: '#A852FF',
                    to: '#6A52FF'
                },
                'gradient-teal': {
                    from: '#86FFE2',
                    to: '#18FFD5'
                },
                'gradient-blue': {
                    from: '#868CFF',
                    to: '#4318FF'
                }
            }
        }
    },
    plugins: [flowbite]
};

export default config;
