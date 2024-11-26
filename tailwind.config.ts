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
                'nav-border': '#3d3d3d',
                'nav-bg': '#181a1a',
                'nav-text': '#bac5d1',

                // Text colors
                'text-primary': '#515568',
                'text-secondary': '#bec1cf',
                'text-meta': '#9d9d9d',
                'text-light': '#e1e1ee',

                // UI Elements
                'icon-gray': '#818181',
                'border-light': '#dbdbdb',
                dark: '#131414',

                // Login specific
                'login-bg': '#56e8cd',
                'login-text': '#18642d',
                'login-button': '#614cff',
                'login-button-hover': 'rgba(97, 76, 255, 0.4)',

                // Gradients (to be used with bg-gradient-to-r)
                'gradient-purple': {
                    from: '#a852ff',
                    to: '#6a52ff'
                },
                'gradient-teal': {
                    from: '#86ffe2',
                    to: '#18ffd5'
                },
                'gradient-blue': {
                    from: '#868cff',
                    to: '#4318ff'
                }
            }
        }
    },
    plugins: [flowbite]
};

export default config;
