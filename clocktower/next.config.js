/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // {
      //   source: '/%F0%9F%94%AE',
      //   destination: '/magic',
      // },
      // {
      //   source: '/🪄',
      //   destination: '/magic',
      // },
    ]
  },
}

module.exports = nextConfig
