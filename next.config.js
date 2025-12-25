/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Output configuration
  output: 'standalone',
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    optimizeCss: true,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Enable tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    }
    
    return config
  },
  
  turbopack: {
    root: __dirname,
  },
  
  env: {
    NEXT_PUBLIC_ENABLE_GPT5: process.env.NEXT_PUBLIC_ENABLE_GPT5 || 'true',
  },
}

module.exports = nextConfig
// Developed by: Kalidas KJ