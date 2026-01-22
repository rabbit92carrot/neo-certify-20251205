import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions 파일 업로드 크기 제한 (기본 1MB → 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // 번들 최적화: barrel imports 자동 최적화
    // lucide-react (98개 파일), date-fns (23개 파일), Radix UI 패키지들
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      // Radix UI 패키지 (알파벳순 정렬)
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
};

export default nextConfig;
