import { ReactNode } from 'react';
import { Viewport } from 'next';
import { Metadata } from 'next';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { dmSans } from '@lib/fonts';
import { lexend } from '@lib/fonts';
import { inter } from '@lib/fonts';
import { validateEnv } from '@lib/env';
import { LoadingProvider } from '@contexts/loading-context';

import './globals.css';

// Import the client component wrapper
import { ClientThemeProvider } from '@components/theme/client-theme-provider';
import { ThemeScript } from '@components/theme/theme-script';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
};

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
        <html lang="en" suppressHydrationWarning>
            <head>
                <ThemeScript />
            </head>
            <body className={`${dmSans.variable} ${lexend.variable} ${inter.variable}`} suppressHydrationWarning>
                <MantineProvider>
                    <ClientThemeProvider>
                        <LoadingProvider>
                            {children}
                        </LoadingProvider>
                    </ClientThemeProvider>
                </MantineProvider>
            </body>
        </html>
    );
};

export default RootLayout;
