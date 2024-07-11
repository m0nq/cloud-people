import type { Metadata } from 'next';
import { Viewport } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-family-dm-sans'
});

export const metadata: Metadata = {
    title: 'Cloud People',
    description: 'Letting the next level of agents run your business from the clouds.'
};

export const viewport: Viewport = {
    // themeColor: '#4265a7'
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode; }>) => (
    <html lang="en">
        <body className={dmSans.className}>
            {children}
        </body>
    </html>
);

export default RootLayout;
