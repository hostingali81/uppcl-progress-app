/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Android app mein unoptimized images better kaam karte hain
    unoptimized: true,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '8ae9a4caacadc49def6c0502df2cb1ea.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-80bb99e8da324e329492e37b185792c8.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Better routing ke liye
  trailingSlash: true,

  // Skip API routes during build (Android app will use live API from server)
  skipTrailingSlashRedirect: true,

  // Disable dev indicators (Next.js logo at bottom)
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
};

module.exports = nextConfig;
