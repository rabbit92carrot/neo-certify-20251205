'use client';

/**
 * 인증 상태 관리 훅
 * 클라이언트 컴포넌트에서 사용자 인증 상태를 관리합니다.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LOGIN_PATH } from '@/constants/routes';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useAuth');
import type { User } from '@supabase/supabase-js';
import type { Organization, ManufacturerSettings } from '@/types/api.types';

/**
 * useAuth 훅 반환 타입
 */
interface UseAuthReturn {
  /** Supabase Auth 사용자 */
  user: User | null;
  /** 조직 정보 */
  organization: Organization | null;
  /** 제조사 설정 (제조사인 경우) */
  manufacturerSettings: ManufacturerSettings | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 인증 여부 */
  isAuthenticated: boolean;
  /** 로그아웃 함수 */
  logout: () => Promise<void>;
  /** 사용자 정보 새로고침 */
  refreshUser: () => Promise<void>;
}

/**
 * 인증 상태 관리 훅
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, organization, isLoading, logout } = useAuth();
 *
 *   if (isLoading) return <Loading />;
 *   if (!user) return <LoginPrompt />;
 *
 *   return <div>Welcome, {organization?.name}</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [manufacturerSettings, setManufacturerSettings] = useState<ManufacturerSettings | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Supabase 클라이언트 메모이제이션
  const supabase = useMemo(() => createClient(), []);

  /**
   * 사용자 및 조직 정보 조회
   */
  const fetchUser = useCallback(async () => {
    try {
      // 현재 사용자 조회
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser);

      if (authUser) {
        // 조직 정보 조회 (제조사 설정 포함)
        const { data: org } = await supabase
          .from('organizations')
          .select('*, manufacturer_settings(*)')
          .eq('auth_user_id', authUser.id)
          .single();

        if (org) {
          // manufacturer_settings 분리 - Supabase 조인 결과 타입 처리
          const rawSettings = org.manufacturer_settings as ManufacturerSettings | ManufacturerSettings[] | null;
          const settings = Array.isArray(rawSettings)
            ? rawSettings[0]
            : rawSettings;

          setOrganization(org as Organization);
          setManufacturerSettings(settings ?? null);
        } else {
          setOrganization(null);
          setManufacturerSettings(null);
        }
      } else {
        setOrganization(null);
        setManufacturerSettings(null);
      }
    } catch (error) {
      logger.error('Error fetching user:', error);
      setUser(null);
      setOrganization(null);
      setManufacturerSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      // 로컬 상태 먼저 클리어
      setUser(null);
      setOrganization(null);
      setManufacturerSettings(null);

      // Supabase 로그아웃
      await supabase.auth.signOut();

      // 로그인 페이지로 이동 (hard navigation)
      window.location.href = LOGIN_PATH;
    } catch (error) {
      logger.error('Error signing out:', error);
      // 오류가 발생해도 로그인 페이지로 이동
      window.location.href = LOGIN_PATH;
    }
  }, [supabase]);

  /**
   * 사용자 정보 새로고침
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  // 초기 로딩 및 Auth 상태 변화 구독
  useEffect(() => {
    // 초기 사용자 정보 조회
    fetchUser();

    // Auth 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrganization(null);
        setManufacturerSettings(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase.auth]);

  return {
    user,
    organization,
    manufacturerSettings,
    isLoading,
    isAuthenticated: !!user && !!organization,
    logout,
    refreshUser,
  };
}
