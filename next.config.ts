import type { NextConfig } from "next";

const nextConfig = {
  env: {
    OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
  },
};

module.exports = nextConfig;


export default nextConfig;
