import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },   // ✅ 린트 에러 무시
  typescript: { ignoreBuildErrors: true },// ✅ TS 타입 에러 무시
  images: { unoptimized: true },
};

export default nextConfig;