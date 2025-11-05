/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverActions: {
    bodySizeLimit: "10mb", // Increased from default 1mb to handle metadata uploads
  },
}

export default nextConfig
