/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  assetPrefix: process.env.NEXTJS_ASSET_PREFIX || "",
};

module.exports = nextConfig;
