/** @type {import('next').NextConfig} */
const nextConfig = {
  // Support client-side routing
  reactStrictMode: true,
  // Allow importing CSS from node_modules
  transpilePackages: [
    'reactflow',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    'framer-motion'
  ],
  // Webpack configuration for handling CSS modules and dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle CSS imports (including modules) on client-side only
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
          },
          'postcss-loader',
        ],
      });
    }

    // Ensure proper handling of client-side packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
}

module.exports = nextConfig
