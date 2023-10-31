/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    taint: false,
  },
  async rewrites() {
    return [
      {
        source: '/towers/:id',
        destination: '/tower/:id',
      },
      {
        source: '/towers/new',
        destination: '/tower/new',
      },
    ]
  },
}

module.exports = nextConfig
