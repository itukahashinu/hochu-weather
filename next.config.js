import next from "next";
const { NextConfig } = next;

const nextConfig = {
  env: {
    OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
  },
};

export default nextConfig;