/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/home",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  /**
   * Debe incluir al menos una clave hoja: `turbopack: {}` no cuenta y Next avisa
   * "Webpack is configured while Turbopack is not".
   * `moduleIds: 'named'` es el valor por defecto en desarrollo con Turbopack.
   */
  turbopack: {
    moduleIds: "named",
  },
  /**
   * Solo aplica a `npm run build` y a `npm run dev:webpack` (no a `npm run dev` con Turbopack).
   * Evita que Webpack/Watchpack intente hacer stat sobre archivos virtuales de Windows
   * (p. ej. C:\pagefile.sys), que disparan EINVAL y pueden corromper la caché en dev.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      // Webpack solo admite ignored como string | RegExp | array de strings (no mezclar con RegExp en el array).
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
