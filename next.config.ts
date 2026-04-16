import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
      remotePatterns: [
        // FIXED 👇 (Add HTTPS for ordere.net)
        {
          protocol: 'https',
          hostname: 'system.ordere.net',
          pathname: '/**'
        },
  
        // If your local dev also uses HTTP
        {
          protocol: 'http',
          hostname: 'system.ordere.net',
          port: '4000',
          pathname: '/**'
        },
  
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '4000',
          pathname: '/**'
        }
      ]
    },

};

export default nextConfig;