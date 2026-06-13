/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vfymttcajeyhrmsyhrtj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
        // Omit `search` key → any query params (signed URL ?token=…) are allowed
      },
    ],
  },
};

export default nextConfig;
