/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    STAGE: process.env.STAGE || 'dev',
    REGION: process.env.REGION || 'local',
    // Cognito URLs removed for local development
    // API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  },
};

module.exports = nextConfig;