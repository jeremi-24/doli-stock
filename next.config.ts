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
        destination: 'https://8080-firebase-stcokback-1751563234648.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev/api/:path*',
      },
    ]
  },
};

export default nextConfig;
