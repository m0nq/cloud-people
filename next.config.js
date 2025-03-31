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
  // Allow cross-origin requests from Windsurf browser preview
  experimental: {
    allowedDevOrigins: ['127.0.0.1'],
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:52543']
    }
  },
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
