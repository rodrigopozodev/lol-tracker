/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com", pathname: "/**" },
      { protocol: "https", hostname: "opgg-static.akamaized.net", pathname: "/**" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  turbopack: {
    moduleIds: "named",
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "C:/pagefile.sys",
          "C:/hiberfil.sys",
          "C:/swapfile.sys",
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
