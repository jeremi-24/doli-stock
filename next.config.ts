import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Le proxy pour les appels côté client
        destination: 'https://3000-firebase-stcokback-1751036275628.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev/api/:path*',
      },
    ]
  },
};

export default nextConfig;
