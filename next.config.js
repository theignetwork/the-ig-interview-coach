// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['localhost'],
    unoptimized: true, // Disable image optimization for now to simplify build
  },
  experimental: {
    // Disable CSS optimization to avoid critters dependency
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'mock-interview-bot.vercel.app', '*.vercel.app'],
    },
  },
  webpack: (config) => {
    // Resolve path aliases correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
