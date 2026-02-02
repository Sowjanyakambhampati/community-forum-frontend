/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for dynamic applications
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  // Add these for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;