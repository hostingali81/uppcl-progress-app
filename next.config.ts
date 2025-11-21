/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // This is the old one, it's safe to keep it
      {
        protocol: 'https',
        hostname: '8ae9a4caacadc49def6c0502df2cb1ea.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      // --- Add this new one ---
      {
        protocol: 'https',
        hostname: 'pub-80bb99e8da324e329492e37b185792c8.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
