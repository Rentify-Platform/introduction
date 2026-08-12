import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
   /* config options here */
   output: 'standalone',
   reactCompiler: true,
   images: {
      remotePatterns: [
         {
            protocol: 'http',
            hostname: '**'
         },
         {
            protocol: 'https',
            hostname: '**'
         }
      ]
   }
}

export default nextConfig
