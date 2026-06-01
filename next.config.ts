import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root,
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.1.50",
    "192.168.1.54",
    "openclaw.tirulescu.com",
    "localhost",
    ".trycloudflare.com",
  ],
  reactStrictMode: true,
};

export default nextConfig;
