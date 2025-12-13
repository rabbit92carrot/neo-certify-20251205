import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions 파일 업로드 크기 제한 (기본 1MB → 5MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
