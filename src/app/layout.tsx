import { Viewport } from 'next';
import { Metadata } from 'next';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import './globals.css';
import { dmSans } from '@lib/fonts';
import { lexend } from '@lib/fonts';
import { inter } from '@lib/fonts';
import { LayoutProps } from '@lib/definitions';
import { validateEnv } from '@lib/env';

export const metadata: Metadata = {
    title: 'Cloud People',
    description: 'Letting the next level of agents run your business from the clouds.'
};

export const viewport: Viewport = {
    // themeColor: '#4265a7'
};

const RootLayout = ({ children }: LayoutProps) => {
    validateEnv();

    return (
        <html lang="en">
            <body className={`${dmSans.variable} ${lexend.variable} ${inter.variable}`} suppressHydrationWarning>
                <MantineProvider>{children}</MantineProvider>
            </body>
        </html>
    );
};

export default RootLayout;
