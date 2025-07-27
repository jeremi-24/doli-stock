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
        destination: 'https://8080-firebase-staback-1753361084962.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev/api/:path*',
      },
    ]
  },
};

export default nextConfig;
