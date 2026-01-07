-- =============================================================================
-- ENUM에 RETURN_SENT, RETURN_RECEIVED 값 추가
--
-- 주의: PostgreSQL에서 새 ENUM 값은 추가된 트랜잭션이 커밋된 후에만 사용 가능
-- 따라서 ENUM 추가와 데이터 마이그레이션을 별도 마이그레이션 파일로 분리
-- =============================================================================

-- ENUM에 새 값 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'RETURN_SENT'
        AND enumtypid = 'history_action_type'::regtype
    ) THEN
        ALTER TYPE history_action_type ADD VALUE 'RETURN_SENT';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'RETURN_RECEIVED'
        AND enumtypid = 'history_action_type'::regtype
    ) THEN
        ALTER TYPE history_action_type ADD VALUE 'RETURN_RECEIVED';
    END IF;
END $$;
