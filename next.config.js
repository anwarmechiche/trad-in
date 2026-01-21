/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Désactivez temporairement les vérifications pour le déploiement
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'rugsjocrmbslsfhyeumn.supabase.co',
        pathname: '**',
      },
    ],
  },
  
  // IMPORTANT : Pour le build sur Vercel
  output: 'standalone',
  
  // Pour Supabase
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig