-- 조직명 고유 제약 조건 추가
-- 동일한 조직명으로 중복 가입을 방지

ALTER TABLE organizations
ADD CONSTRAINT organizations_name_unique UNIQUE (name);

-- 인덱스는 UNIQUE 제약 조건에 의해 자동 생성됨
COMMENT ON CONSTRAINT organizations_name_unique ON organizations IS '조직명은 고유해야 합니다';
