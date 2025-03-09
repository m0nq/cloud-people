import type { NextConfig } from 'next';

const config: NextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['images.unsplash.com']
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },
    experimental: {
        // implement for partial pre-rendering
        // ppr: 'incremental'
        // currently not playing well with react-icons library
        // reactCompiler: true
        turbo: {
            rules: {
                // Your Turbopack-specific rules here
            }
        }
    },
    // Configure route segment config
    serverRuntimeConfig: {
        runtime: 'nodejs'
    },
    // Set runtime for specific routes
    async headers() {
        return [
            {
                source: '/api/agent/:path*',
                headers: [
                    {
                        key: 'x-custom-runtime',
                        value: 'nodejs'
                    }
                ]
            }
        ];
    },
    webpack: (config: any) => {
        // Only apply these optimizations in development
        if (process.env.NODE_ENV === 'development') {
            // Silence infrastructure logging
            if (!config.infrastructureLogging) {
                config.infrastructureLogging = {};
            }
            config.infrastructureLogging.level = 'error';

            // Optimize cache strategy
            if (config.cache && typeof config.cache === 'object') {
                config.cache = {
                    ...config.cache,
                    compression: 'gzip',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
                    memoryCacheUnaffected: true // Reduce memory pressure
                };
            }
        }
        return config;
    }
};

// Remove bundle analyzer for now as it's causing issues
export default config;
