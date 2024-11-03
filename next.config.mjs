import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true'
});

/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },
    experimental: {
        // implement for partial pre-rendering
        // ppr: 'incremental'
    }
};

export default withBundleAnalyzer(nextConfig);
