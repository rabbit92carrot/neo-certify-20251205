'use client';

/**
 * 로그아웃 버튼 컴포넌트
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LOGIN_PATH } from '@/constants/routes';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function LogoutButton({
  variant = 'outline',
  size = 'default',
  className,
}: LogoutButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // useMemo로 Supabase 클라이언트 인스턴스 캐싱 (매 렌더마다 재생성 방지)
  const supabase = useMemo(() => createClient(), []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push(LOGIN_PATH);
      router.refresh();
    } catch {
      toast.error('로그아웃에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? '로그아웃 중…' : '로그아웃'}
    </Button>
  );
}
