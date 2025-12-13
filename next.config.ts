import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions 파일 업로드 크기 제한 (기본 1MB → 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
