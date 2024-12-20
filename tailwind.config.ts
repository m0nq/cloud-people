import flowbite from 'flowbite/plugin';
import defaultTheme from 'tailwindcss/defaultTheme';
import { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        fontFamily: {
            sans: ['var(--font-family-dm-sans)', ...defaultTheme.fontFamily.sans],
            lexend: ['var(--font-family-lexend)', ...defaultTheme.fontFamily.sans],
            inter: ['var(--font-family-inter)', ...defaultTheme.fontFamily.sans]
        },
        extend: {
            boxShadow: {
                default: '0px 4px 4px 0px rgba(0, 0, 0, 0.25), ' +
                    '0px 4px 4px 0px rgba(0, 0, 0, 0.25), ' +
                    '0px 0px 10px 0px rgba(246, 246, 246, 0.20)'
            },
            colors: {
                // Brand colors
                primary: '#6652ff',
                secondary: '#56e8cd',

                // Dark mode
                dark: '#181a1a',

                // Navigation
                'nav-border': '#3d3d3d',
                'nav-text': '#bac5d1',

                // Text
                'color-light': '#dce0f4',

                'color-light-grey': '#45505a',
                'color-dark-grey': '#2d3034',
                'color-grey': '#515568',
                'color-slate': '#bec1cf',
                'color-meta': '#9d9d9d',
                // 'color-light': '#cfcfcf',

                'icon-gray': '#818181',
                'border-light': '#dbdbdb',

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
