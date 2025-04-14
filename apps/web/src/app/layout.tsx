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
// Import the user provider for authentication
import { UserProvider } from '@contexts/user-context';
// Import the development toolbar
import { DevToolbar } from '@components/dev/dev-toolbar';

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

    // Determine if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <ThemeScript />
            </head>
            <body className={`${dmSans.variable} ${lexend.variable} ${inter.variable}`} suppressHydrationWarning>
                <MantineProvider>
                    <ClientThemeProvider>
                        <LoadingProvider>
                            <UserProvider>
                                {children}
                                {/* Development toolbar for toggling between real and mock services */}
                                {isDevelopment && <DevToolbar position="bottom-right" />}
                            </UserProvider>
                        </LoadingProvider>
                    </ClientThemeProvider>
                </MantineProvider>
            </body>
        </html>
    );
};

export default RootLayout;
