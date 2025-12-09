/**
 * Supabase 데이터베이스 타입 정의
 *
 * 이 파일은 Phase 1에서 Supabase CLI로 자동 생성됩니다.
 * 명령어: npx supabase gen types typescript --local > src/types/database.types.ts
 *
 * 현재는 placeholder로 기본 구조만 정의되어 있습니다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Phase 1에서 실제 테이블 정의 추가 예정
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      // Phase 1에서 실제 Enum 정의 추가 예정
      organization_type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'ADMIN';
      organization_status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
      virtual_code_status: 'IN_STOCK' | 'USED' | 'DISPOSED';
      owner_type: 'ORGANIZATION' | 'PATIENT';
      history_action_type:
        | 'PRODUCED'
        | 'SHIPPED'
        | 'RECEIVED'
        | 'TREATED'
        | 'RECALLED'
        | 'DISPOSED';
      notification_type: 'CERTIFICATION' | 'RECALL';
    };
  };
}

// 공용 타입 추출 헬퍼
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
