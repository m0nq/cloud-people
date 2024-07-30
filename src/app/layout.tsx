import { Viewport } from 'next';
import { Metadata } from 'next';

import './globals.css';
import { dmSans } from '@lib/fonts';
import { lexend } from '@lib/fonts';
import { LayoutProps } from '@lib/definitions';

export const metadata: Metadata = {
    title: 'Cloud People',
    description: 'Letting the next level of agents run your business from the clouds.'
};

export const viewport: Viewport = {
    // themeColor: '#4265a7'
};

const RootLayout = ({ children }: LayoutProps) => {

    return (
        <html lang="en">
            <body className={`${dmSans.variable} ${lexend.variable}`}>
                {children}
            </body>
        </html>
    );
};

export default RootLayout;
