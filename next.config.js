const packageConfig = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  assetPrefix: process.env.NEXTJS_ASSET_PREFIX || "",
  env: {
    SAMPLE_JSON: JSON.stringify(packageConfig, null, 2),
  },
};

module.exports = nextConfig;
