import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.50", "openclaw.tirulescu.com", "localhost", ".trycloudflare.com"],
  reactStrictMode: true,
};

export default nextConfig;
