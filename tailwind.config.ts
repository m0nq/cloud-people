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
            head: ['var(--font-family-lexend)', ...defaultTheme.fontFamily.sans]
        }
    },
    plugins: [flowbite]
};
export default config;