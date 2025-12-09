-- Migration: 00001_create_enums
-- Description: Create ENUM types for Neo-Certify database
-- Created: 2025-12-09

-- Organization Type
-- Represents the type of organization in the system
CREATE TYPE organization_type AS ENUM (
  'MANUFACTURER',  -- 제조사
  'DISTRIBUTOR',   -- 유통사
  'HOSPITAL',      -- 병원
  'ADMIN'          -- 관리자
);

COMMENT ON TYPE organization_type IS '조직 유형: 제조사, 유통사, 병원, 관리자';

-- Organization Status
-- Represents the current status of an organization
CREATE TYPE organization_status AS ENUM (
  'PENDING_APPROVAL',  -- 승인 대기
  'ACTIVE',            -- 활성
  'INACTIVE',          -- 비활성
  'DELETED'            -- 삭제됨 (soft delete)
);

COMMENT ON TYPE organization_status IS '조직 상태: 승인대기, 활성, 비활성, 삭제됨';

-- Virtual Code Status
-- Represents the current status of a virtual identification code
CREATE TYPE virtual_code_status AS ENUM (
  'IN_STOCK',   -- 재고 (생산 완료, 보유 중)
  'USED',       -- 사용됨 (환자에게 시술)
  'DISPOSED'    -- 폐기됨 (2차 개발)
);

COMMENT ON TYPE virtual_code_status IS '가상 식별코드 상태: 재고, 사용됨, 폐기됨';

-- Owner Type
-- Represents who owns a virtual code
CREATE TYPE owner_type AS ENUM (
  'ORGANIZATION',  -- 조직 (제조사/유통사/병원)
  'PATIENT'        -- 환자
);

COMMENT ON TYPE owner_type IS '소유자 유형: 조직, 환자';

-- History Action Type
-- Represents the type of action recorded in history
CREATE TYPE history_action_type AS ENUM (
  'PRODUCED',   -- 생산
  'SHIPPED',    -- 출고
  'RECEIVED',   -- 입고
  'TREATED',    -- 시술
  'RECALLED',   -- 회수
  'DISPOSED'    -- 폐기
);

COMMENT ON TYPE history_action_type IS '이력 액션 유형: 생산, 출고, 입고, 시술, 회수, 폐기';

-- Notification Type
-- Represents the type of notification message
CREATE TYPE notification_type AS ENUM (
  'CERTIFICATION',  -- 정품 인증
  'RECALL'          -- 회수 알림
);

COMMENT ON TYPE notification_type IS '알림 유형: 정품인증, 회수알림';
