import flowbite from 'flowbite/plugin';
import defaultTheme from 'tailwindcss/defaultTheme';
import { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        fontFamily: {
            sans: ['var(--font-family-dm-sans)', ...defaultTheme.fontFamily.sans],
            lexend: ['var(--font-family-lexend)', ...defaultTheme.fontFamily.sans],
            inter: ['var(--font-family-inter)', ...defaultTheme.fontFamily.sans]
        },
        extend: {
            animation: {
                'scale-in-hor-center': 'scale-in-hor-center 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;',
                'border-spin': 'border-spin 8s linear infinite'
            },
            keyframes: {
                'scale-in-hor-center': {
                    '0%': {
                        transform: 'scaleX(0)',
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'scaleX(1)',
                        opacity: '1'
                    }
                },
                'border-spin': {
                    '0%': {
                        transform: 'rotate(0deg)'
                    },
                    '100%': {
                        transform: 'rotate(360deg)'
                    }
                }
            },
            boxShadow: {
                default: '0px 4px 4px 0px rgba(0, 0, 0, 0.25), ' + '0px 4px 4px 0px rgba(0, 0, 0, 0.25), ' + '0px 0px 10px 0px rgba(246, 246, 246, 0.20)'
            },
            colors: {
                // Brand colors
                primary: '#6652ff',
                secondary: '#56e8cd',

                // Background colors
                light: {
                    DEFAULT: '#ffffff',
                    secondary: '#f9fafb'
                },
                dark: {
                    DEFAULT: '#181a1a',
                    secondary: '#1f2937'
                },

                // Button colors
                'btn-gray': {
                    light: '#515568',
                    dark: '#374151'
                },
                'btn-muted': {
                    light: '#111212',
                    dark: '#1f2937'
                },

                // Navigation
                'nav-border': {
                    light: '#e5e7eb',
                    dark: '#3d3d3d'
                },
                'nav-text': {
                    light: '#4b5563',
                    dark: '#bac5d1'
                },

                // Text colors
                text: {
                    primary: {
                        light: '#111827',
                        dark: '#f9fafb'
                    },
                    secondary: {
                        light: '#4b5563',
                        dark: '#9ca3af'
                    },
                    muted: {
                        light: '#6b7280',
                        dark: '#6b7280'
                    }
                },

                // Border colors
                border: {
                    light: '#e5e7eb',
                    dark: '#374151'
                },

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
                },
                'gradient-dark': {
                    from: '#333c44',
                    to: '#2d2f32'
                }
            }
        }
    },
    plugins: [flowbite]
};

export default config;
