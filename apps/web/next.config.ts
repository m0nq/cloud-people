import type { NextConfig } from 'next';

const config: NextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'images.unsplash.com'
        }]
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
        },
        // Allow cross-origin requests from Windsurf browser preview
        allowedDevOrigins: ['127.0.0.1'],
        serverActions: {
            allowedOrigins: ['localhost:3000', '127.0.0.1:52543']
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
    webpack: (config: any, { isServer }: { isServer: boolean }) => {
        // Silence the specific "Serializing big strings" warning
        if (!config.ignoreWarnings) {
            config.ignoreWarnings = [];
        }
        config.ignoreWarnings.push(/Serializing big strings.*webpack\.cache\.PackFileCacheStrategy/);

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

        // --- Add SVGR logic here ---
        // Grab the existing rule that handles SVG imports
        const fileLoaderRule = config.module.rules.find((rule: any) =>
            rule.test?.test?.('.svg'),
        );

        config.module.rules.push(
            // Reapply the existing rule, but only for svg imports ending in ?url
            {
                ...(fileLoaderRule as object),
                test: /\.svg$/i,
                resourceQuery: /url/, // *.svg?url
            },
            // Convert all other SVG imports to React components
            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/,
                resourceQuery: { not: /url/ }, // exclude if *.svg?url
                use: ['@svgr/webpack'],
            },
        );

        // Modify the file loader rule to ignore *.svg, since we have it handled now.
        if (fileLoaderRule) {
            fileLoaderRule.exclude = /\.svg$/i;
        }
        // --- End of SVGR logic ---

        return config;
    }
};

// Remove bundle analyzer for now as it's causing issues
export default config;
