/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'storage-baritone-linoleum.ngrok-free.dev',
    '*.ngrok-free.dev',
    '*.ngrok.app',
    '*.ngrok.io',
    'localhost:3000',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.io'],
    },
  },
  async rewrites() {
    const rawApi = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const apiBase = rawApi.replace('localhost', '127.0.0.1');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
