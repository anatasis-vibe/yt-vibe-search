const nextConfig = {
  typescript: { ignoreBuildErrors: true }, // TS 오류로 빌드 멈추지 않음
  eslint: { ignoreDuringBuilds: true },    // ESLint 오류로 빌드 멈추지 않음
  images: { unoptimized: true },
};
export default nextConfig;