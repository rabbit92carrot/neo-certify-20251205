/**
 * 관리자 서비스 공통 타입
 */

import type { Database } from '@/types/database.types';

// RPC 반환 타입 정의
export type OrgStatusCountRow = Database['public']['Functions']['get_organization_status_counts']['Returns'][number];
export type AllRecallsRow = Database['public']['Functions']['get_all_recalls']['Returns'][number];
export type AdminEventSummaryRow = Database['public']['Functions']['get_admin_event_summary']['Returns'][number];
export type LotCodesPaginatedRow = Database['public']['Functions']['get_lot_codes_paginated']['Returns'][number];

// 상수
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
