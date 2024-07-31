import { DM_Sans } from 'next/font/google';
import { Lexend } from 'next/font/google';
import { Inter } from 'next/font/google';

export const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-family-dm-sans'
});

export const lexend = Lexend({
    subsets: ['latin'],
    variable: '--font-family-lexend'
});

export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-family-inter'
});

