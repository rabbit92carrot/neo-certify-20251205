


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."history_action_type" AS ENUM (
    'PRODUCED',
    'SHIPPED',
    'RECEIVED',
    'TREATED',
    'RECALLED',
    'DISPOSED'
);


ALTER TYPE "public"."history_action_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'CERTIFICATION',
    'RECALL'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."organization_alert_type" AS ENUM (
    'INACTIVE_PRODUCT_USAGE',
    'SYSTEM_NOTICE',
    'CUSTOM_MESSAGE'
);


ALTER TYPE "public"."organization_alert_type" OWNER TO "postgres";


CREATE TYPE "public"."organization_status" AS ENUM (
    'PENDING_APPROVAL',
    'ACTIVE',
    'INACTIVE',
    'DELETED'
);


ALTER TYPE "public"."organization_status" OWNER TO "postgres";


CREATE TYPE "public"."organization_type" AS ENUM (
    'MANUFACTURER',
    'DISTRIBUTOR',
    'HOSPITAL',
    'ADMIN'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


CREATE TYPE "public"."owner_type" AS ENUM (
    'ORGANIZATION',
    'PATIENT'
);


ALTER TYPE "public"."owner_type" OWNER TO "postgres";


CREATE TYPE "public"."product_deactivation_reason" AS ENUM (
    'DISCONTINUED',
    'SAFETY_ISSUE',
    'QUALITY_ISSUE',
    'OTHER'
);


ALTER TYPE "public"."product_deactivation_reason" OWNER TO "postgres";


CREATE TYPE "public"."virtual_code_status" AS ENUM (
    'IN_STOCK',
    'USED',
    'DISPOSED'
);


ALTER TYPE "public"."virtual_code_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_quantity_to_lot"("p_lot_id" "uuid", "p_additional_quantity" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_manufacturer_id UUID;
  v_current_quantity INT;
  v_new_quantity INT;
BEGIN
  -- Input validation
  IF p_additional_quantity <= 0 THEN
    RAISE EXCEPTION 'Additional quantity must be positive: %', p_additional_quantity;
  END IF;

  -- Get current Lot info
  SELECT l.quantity, p.organization_id
  INTO v_current_quantity, v_manufacturer_id
  FROM lots l
  JOIN products p ON p.id = l.product_id
  WHERE l.id = p_lot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found: %', p_lot_id;
  END IF;

  -- Maximum quantity check (100,000 limit)
  v_new_quantity := v_current_quantity + p_additional_quantity;
  IF v_new_quantity > 100000 THEN
    RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
      v_current_quantity, p_additional_quantity, v_new_quantity;
  END IF;

  -- Update quantity
  UPDATE lots
  SET quantity = v_new_quantity
  WHERE id = p_lot_id;

  -- BULK INSERT: Generate virtual_codes in single query
  INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
  SELECT
    generate_virtual_code(),
    p_lot_id,
    'IN_STOCK',
    'ORGANIZATION',
    v_manufacturer_id::VARCHAR
  FROM generate_series(1, p_additional_quantity);

  RETURN v_new_quantity;
END;
$$;


ALTER FUNCTION "public"."add_quantity_to_lot"("p_lot_id" "uuid", "p_additional_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unique_patients"("p_hospital_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COUNT(DISTINCT patient_phone)::INTEGER
  FROM treatment_records
  WHERE hospital_id = p_hospital_id;
$$;


ALTER FUNCTION "public"."count_unique_patients"("p_hospital_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_manufacturer_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.type = 'MANUFACTURER' THEN
    INSERT INTO manufacturer_settings (organization_id)
    VALUES (NEW.id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_manufacturer_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shipment_atomic"("p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") RETURNS TABLE("shipment_batch_id" "uuid", "total_quantity" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_from_org_id UUID;
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요하거나 조직에 소속되어 있지 않습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO shipment_batches (from_organization_id, to_organization_id, to_organization_type)
  VALUES (v_from_org_id, p_to_org_id, p_to_org_type)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_from_org_id::VARCHAR
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = p_to_org_id::VARCHAR, owner_type = 'ORGANIZATION'
      WHERE id = v_code_id;

      -- SHIPPED history (sender's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'SHIPPED', 'ORGANIZATION', v_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      -- RECEIVED history (receiver's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'RECEIVED', 'ORGANIZATION', v_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_shipment_atomic"("p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shipment_atomic"("p_from_org_id" "uuid", "p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") RETURNS TABLE("shipment_batch_id" "uuid", "total_quantity" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
  v_item_quantity INT;  -- 각 아이템별 수량 추적
BEGIN
  -- Validate input
  IF p_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT
      NULL::UUID,
      0,
      'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Verify target organization exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT
      NULL::UUID,
      0,
      'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Create shipment batch
  INSERT INTO shipment_batches (
    from_organization_id,
    to_organization_id,
    to_organization_type
  ) VALUES (
    p_from_org_id,
    p_to_org_id,
    p_to_org_type
  ) RETURNING id INTO v_batch_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;
    v_item_quantity := 0;

    -- Select FIFO codes with lock (using subquery to avoid ARRAY_AGG + FOR UPDATE conflict)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_from_org_id::VARCHAR
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- Check if we got enough codes
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      -- Rollback by raising exception
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    -- Insert shipment details
    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      -- Update ownership
      UPDATE virtual_codes
      SET owner_id = p_to_org_id::VARCHAR,
          owner_type = 'ORGANIZATION'
      WHERE id = v_code_id;

      -- Record history
      INSERT INTO histories (
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        shipment_batch_id,
        is_recall
      ) VALUES (
        v_code_id,
        'SHIPPED',
        'ORGANIZATION',
        p_from_org_id::VARCHAR,
        'ORGANIZATION',
        p_to_org_id::VARCHAR,
        v_batch_id,
        FALSE
      );

      v_total := v_total + 1;
      v_item_quantity := v_item_quantity + 1;
    END LOOP;

    -- 비활성 제품 사용 로그 (아이템별로 기록)
    PERFORM log_inactive_product_usage(
      'SHIPMENT',
      v_batch_id,
      v_product_id,
      p_from_org_id,
      v_item_quantity
    );
  END LOOP;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    -- Parse custom error format
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INTERNAL_ERROR'::VARCHAR,
        SQLERRM::VARCHAR;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_shipment_atomic"("p_from_org_id" "uuid", "p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_treatment_atomic"("p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") RETURNS TABLE("treatment_id" "uuid", "total_quantity" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_hospital_id UUID;
  v_hospital_type organization_type;
  v_treatment_id UUID;
  v_normalized_phone VARCHAR;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Verify the user is from a hospital
  v_hospital_type := get_user_organization_type();
  IF v_hospital_type != 'HOSPITAL' THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'FORBIDDEN'::VARCHAR,
      '병원만 시술을 등록할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  v_normalized_phone := get_or_create_patient(p_patient_phone);

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = v_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO treatment_records (hospital_id, patient_phone, treatment_date)
  VALUES (v_hospital_id, v_normalized_phone, p_treatment_date)
  RETURNING id INTO v_treatment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_hospital_id::VARCHAR
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = v_normalized_phone, owner_type = 'PATIENT', status = 'USED'
      WHERE id = v_code_id;

      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', v_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_treatment_atomic"("p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_treatment_atomic"("p_hospital_id" "uuid", "p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") RETURNS TABLE("treatment_id" "uuid", "total_quantity" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_treatment_id UUID;
  v_normalized_phone VARCHAR;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
  v_item_quantity INT;  -- 각 아이템별 수량 추적
BEGIN
  -- Normalize and create/get patient
  v_normalized_phone := get_or_create_patient(p_patient_phone);

  -- Verify hospital exists
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT
      NULL::UUID,
      0,
      'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Create treatment record
  INSERT INTO treatment_records (
    hospital_id,
    patient_phone,
    treatment_date
  ) VALUES (
    p_hospital_id,
    v_normalized_phone,
    p_treatment_date
  ) RETURNING id INTO v_treatment_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_item_quantity := 0;

    -- Select FIFO codes with lock (using subquery to avoid ARRAY_AGG + FOR UPDATE conflict)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_hospital_id::VARCHAR
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- Check if we got enough codes
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    -- Insert treatment details and update codes
    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      -- Update ownership to patient and status to USED
      UPDATE virtual_codes
      SET owner_id = v_normalized_phone,
          owner_type = 'PATIENT',
          status = 'USED'
      WHERE id = v_code_id;

      -- Record history
      INSERT INTO histories (
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        is_recall
      ) VALUES (
        v_code_id,
        'TREATED',
        'ORGANIZATION',
        p_hospital_id::VARCHAR,
        'PATIENT',
        v_normalized_phone,
        FALSE
      );

      v_total := v_total + 1;
      v_item_quantity := v_item_quantity + 1;
    END LOOP;

    -- 비활성 제품 사용 로그 (아이템별로 기록)
    PERFORM log_inactive_product_usage(
      'TREATMENT',
      v_treatment_id,
      v_product_id,
      p_hospital_id,
      v_item_quantity
    );
  END LOOP;

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INTERNAL_ERROR'::VARCHAR,
        SQLERRM::VARCHAR;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_treatment_atomic"("p_hospital_id" "uuid", "p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_virtual_codes_for_lot"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_manufacturer_id UUID;
BEGIN
  -- Get the manufacturer ID from the product
  SELECT p.organization_id INTO v_manufacturer_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- BULK INSERT: Single query instead of FOR loop
  -- generate_virtual_code_v2() 사용 (HMAC 서명 포함)
  INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
  SELECT
    generate_virtual_code_v2(),
    NEW.id,
    'IN_STOCK',
    'ORGANIZATION',
    v_manufacturer_id::VARCHAR
  FROM generate_series(1, NEW.quantity);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_virtual_codes_for_lot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."date_trunc_minute_immutable"("ts" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
  SELECT DATE_TRUNC('minute', ts AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
$$;


ALTER FUNCTION "public"."date_trunc_minute_immutable"("ts" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_patient_exists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO patients (phone_number)
  VALUES (NEW.patient_phone)
  ON CONFLICT (phone_number) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_patient_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_hmac_signature"("payload" "text") RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  secret_key TEXT;
  full_hash TEXT;
BEGIN
  secret_key := get_virtual_code_secret();

  -- HMAC-SHA256 계산 후 앞 4자리 추출 (대문자)
  -- extensions 스키마에서 hmac 함수 호출
  full_hash := UPPER(encode(extensions.hmac(payload::bytea, secret_key::bytea, 'sha256'), 'hex'));

  RETURN SUBSTRING(full_hash FROM 1 FOR 4);
END;
$$;


ALTER FUNCTION "public"."generate_hmac_signature"("payload" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_lot_number"("p_manufacturer_id" "uuid", "p_model_name" character varying, "p_manufacture_date" "date" DEFAULT CURRENT_DATE) RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_prefix VARCHAR;
  v_model_digits INT;
  v_date_format VARCHAR;
  v_model_code VARCHAR;
  v_date_str VARCHAR;
  v_extracted_digits VARCHAR;
BEGIN
  -- Get manufacturer settings
  SELECT lot_prefix, lot_model_digits, lot_date_format
  INTO v_prefix, v_model_digits, v_date_format
  FROM manufacturer_settings
  WHERE organization_id = p_manufacturer_id;

  -- Use defaults if no settings found
  IF NOT FOUND THEN
    v_prefix := 'ND';
    v_model_digits := 5;
    v_date_format := 'yymmdd';
  END IF;

  -- Extract first continuous digits after leading letters
  -- Pattern: ^[A-Za-z]* matches leading letters, ([0-9]+) captures first digit sequence
  v_extracted_digits := (REGEXP_MATCH(p_model_name, '^[A-Za-z]*([0-9]+)'))[1];

  -- If no digits found, use '0'
  IF v_extracted_digits IS NULL THEN
    v_extracted_digits := '0';
  END IF;

  -- Take first N digits and pad with leading zeros
  v_model_code := LPAD(
    SUBSTRING(v_extracted_digits FROM 1 FOR v_model_digits),
    v_model_digits,
    '0'
  );

  -- Format date
  CASE v_date_format
    WHEN 'yymmdd' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMMDD');
    WHEN 'yyyymmdd' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYYYMMDD');
    WHEN 'yymm' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMM');
    ELSE
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMMDD');
  END CASE;

  RETURN v_prefix || v_model_code || v_date_str;
END;
$$;


ALTER FUNCTION "public"."generate_lot_number"("p_manufacturer_id" "uuid", "p_model_name" character varying, "p_manufacture_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_virtual_code"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempts INT := 0;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
    new_code := 'NC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

    -- Check for duplicates
    SELECT EXISTS(SELECT 1 FROM virtual_codes WHERE code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique virtual code after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_virtual_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_virtual_code_v2"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  payload VARCHAR(8);
  signature VARCHAR(4);
  new_code VARCHAR(20);
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempts INT := 0;
BEGIN
  LOOP
    -- 8자리 암호학적 난수 페이로드 생성 (대문자 HEX)
    -- gen_random_bytes()는 pgcrypto의 암호학적으로 안전한 난수 생성기 사용
    payload := UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 8));

    -- HMAC 서명 생성 (4자리)
    signature := generate_hmac_signature(payload);

    -- 최종 코드: NC-{PAYLOAD}-{SIGNATURE}
    new_code := 'NC-' || payload || '-' || signature;

    -- 중복 체크
    SELECT EXISTS(SELECT 1 FROM virtual_codes WHERE code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique virtual code after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_virtual_code_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_event_summary"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_organization_id" "uuid" DEFAULT NULL::"uuid", "p_lot_number" "text" DEFAULT NULL::"text", "p_product_id" "uuid" DEFAULT NULL::"uuid", "p_include_recalled" boolean DEFAULT true, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("group_key" "text", "event_time" timestamp with time zone, "action_type" character varying, "from_owner_type" character varying, "from_owner_id" character varying, "to_owner_type" character varying, "to_owner_id" character varying, "is_recall" boolean, "recall_reason" "text", "total_quantity" bigint, "lot_summaries" "jsonb", "sample_code_ids" "uuid"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH filtered_histories AS (
    -- 필터 조건에 맞는 이력 조회
    SELECT
      h.id AS history_id,
      h.virtual_code_id,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.recall_reason AS recall_desc,
      h.created_at,
      l.id AS lot_id,
      l.lot_number,
      p.id AS product_id,
      p.name AS product_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      (p_start_date IS NULL OR h.created_at >= p_start_date)
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_organization_id IS NULL OR
           h.from_owner_id = p_organization_id::VARCHAR OR
           h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
      AND (p_product_id IS NULL OR p.id = p_product_id)
      AND (p_include_recalled OR h.is_recall = FALSE)
  ),
  -- 이벤트 그룹별 집계 (분 단위 + 액션 + 출발지 + 도착지)
  -- 최적화: 샘플 코드만 수집 (전체 수집 X)
  grouped AS (
    SELECT
      DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
        fh.act_type || '_' ||
        COALESCE(fh.from_id, '') || '_' ||
        COALESCE(fh.to_id, '') AS grp_key,
      MAX(fh.created_at) AS latest_time,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      MAX(fh.recall_desc) AS recall_desc,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      COUNT(*) AS qty,
      -- 최적화: 상위 10개 샘플만 수집 (메모리 절약)
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at))[1:10] AS sample_code_ids
    FROM filtered_histories fh
    GROUP BY
      DATE_TRUNC('minute', fh.created_at),
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name
  ),
  -- 최종 집계: 여러 Lot을 하나의 이벤트로 묶기
  aggregated AS (
    SELECT
      g.grp_key,
      MAX(g.latest_time) AS event_time,
      g.act_type,
      MAX(g.from_type) AS from_type,
      g.from_id,
      MAX(g.to_type) AS to_type,
      g.to_id,
      g.recall_flag,
      MAX(g.recall_desc) AS recall_desc,
      SUM(g.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'lotId', g.lot_id,
          'lotNumber', g.lot_number,
          'productId', g.product_id,
          'productName', g.product_name,
          'quantity', g.qty
        )
      ) AS lot_summaries,
      -- 최적화: 이미 샘플만 수집되어 있으므로 단순화
      (ARRAY_AGG(g.sample_code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  )
  SELECT
    a.grp_key,
    a.event_time,
    a.act_type::VARCHAR,
    a.from_type::VARCHAR,
    a.from_id,
    a.to_type::VARCHAR,
    a.to_id,
    a.recall_flag,
    a.recall_desc,
    a.total_qty,
    a.lot_summaries,
    a.sample_codes
  FROM aggregated a
  ORDER BY a.event_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_admin_event_summary"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_event_summary_count"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_organization_id" "uuid" DEFAULT NULL::"uuid", "p_lot_number" "text" DEFAULT NULL::"text", "p_product_id" "uuid" DEFAULT NULL::"uuid", "p_include_recalled" boolean DEFAULT true) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT (
    DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
    h.action_type || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '') || '_' ||
    h.is_recall::TEXT
  ))
  INTO v_count
  FROM histories h
  INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
  INNER JOIN lots l ON l.id = vc.lot_id
  INNER JOIN products p ON p.id = l.product_id
  WHERE
    (p_start_date IS NULL OR h.created_at >= p_start_date)
    AND (p_end_date IS NULL OR h.created_at <= p_end_date)
    AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
    AND (p_organization_id IS NULL OR
         h.from_owner_id = p_organization_id::VARCHAR OR
         h.to_owner_id = p_organization_id::VARCHAR)
    AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
    AND (p_product_id IS NULL OR p.id = p_product_id)
    AND (p_include_recalled OR h.is_recall = FALSE);

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_admin_event_summary_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_organization_id" "uuid" DEFAULT NULL::"uuid", "p_lot_number" "text" DEFAULT NULL::"text", "p_product_id" "uuid" DEFAULT NULL::"uuid", "p_include_recalled" boolean DEFAULT true, "p_limit" integer DEFAULT 50, "p_cursor_time" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_cursor_key" "text" DEFAULT NULL::"text") RETURNS TABLE("group_key" "text", "event_time" timestamp with time zone, "action_type" character varying, "from_owner_type" character varying, "from_owner_id" character varying, "to_owner_type" character varying, "to_owner_id" character varying, "is_recall" boolean, "recall_reason" "text", "total_quantity" bigint, "lot_summaries" "jsonb", "sample_code_ids" "uuid"[], "has_more" boolean)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "statement_timeout" TO '30s'
    AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH filtered_histories AS (
    SELECT
      h.id AS history_id,
      h.virtual_code_id,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.recall_reason AS recall_desc,
      h.created_at,
      l.id AS lot_id,
      l.lot_number,
      p.id AS product_id,
      p.name AS product_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_organization_id IS NULL OR
           h.from_owner_id = p_organization_id::VARCHAR OR
           h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
      AND (p_product_id IS NULL OR p.id = p_product_id)
      AND (p_include_recalled OR h.is_recall = FALSE)
  ),
  grouped AS (
    SELECT
      DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
        fh.act_type || '_' ||
        COALESCE(fh.from_id, '') || '_' ||
        COALESCE(fh.to_id, '') AS grp_key,
      MAX(fh.created_at) AS latest_time,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      MAX(fh.recall_desc) AS recall_desc,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      COUNT(*) AS qty,
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at DESC))[1:10] AS lot_code_ids
    FROM filtered_histories fh
    GROUP BY
      DATE_TRUNC('minute', fh.created_at),
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name
  ),
  aggregated AS (
    SELECT
      g.grp_key,
      MAX(g.latest_time) AS event_time,
      g.act_type,
      MAX(g.from_type) AS from_type,
      g.from_id,
      MAX(g.to_type) AS to_type,
      g.to_id,
      g.recall_flag,
      MAX(g.recall_desc) AS recall_desc,
      SUM(g.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'lotId', g.lot_id,
          'lotNumber', g.lot_number,
          'productId', g.product_id,
          'productName', g.product_name,
          'quantity', g.qty,
          'codeIds', g.lot_code_ids
        )
      ) AS lot_summaries,
      (ARRAY_AGG(g.lot_code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.event_time < p_cursor_time)
      OR (a.event_time = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.event_time DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  SELECT
    l.grp_key,
    l.event_time,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    l.to_type::VARCHAR,
    l.to_id,
    l.recall_flag,
    l.recall_desc,
    l.total_qty,
    l.lot_summaries,
    l.sample_codes,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.event_time DESC, l.grp_key DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") IS '관리자 이벤트 요약 커서 기반 페이지네이션 (기본 3일, timeout 30s)';



CREATE OR REPLACE FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_type" "text" DEFAULT 'all'::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("recall_id" "uuid", "recall_type" "text", "recall_date" timestamp with time zone, "recall_reason" "text", "quantity" bigint, "from_org_id" "uuid", "from_org_name" "text", "from_org_type" "text", "to_id" "text", "to_name" "text", "to_type" "text", "product_summary" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "statement_timeout" TO '30s'
    AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH shipment_recalls AS (
    SELECT
      sb.id AS recall_id,
      'shipment'::TEXT AS recall_type,
      sb.recall_date AS recall_date,
      sb.recall_reason::TEXT AS recall_reason,
      (
        SELECT COUNT(*)::BIGINT
        FROM shipment_details sd
        WHERE sd.shipment_batch_id = sb.id
      ) AS quantity,
      from_org.id AS from_org_id,
      -- FIX: VARCHAR(100) → TEXT 명시적 캐스팅
      from_org.name::TEXT AS from_org_name,
      from_org.type::TEXT AS from_org_type,
      to_org.id::TEXT AS to_id,
      -- FIX: VARCHAR(100) → TEXT 명시적 캐스팅
      to_org.name::TEXT AS to_name,
      to_org.type::TEXT AS to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM shipment_details sd
          JOIN virtual_codes vc ON vc.id = sd.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE sd.shipment_batch_id = sb.id
          GROUP BY p.name
        ) product_counts
      ) AS product_summary
    FROM shipment_batches sb
    JOIN organizations from_org ON from_org.id = sb.from_organization_id
    LEFT JOIN organizations to_org ON to_org.id = sb.to_organization_id
    WHERE sb.is_recalled = TRUE
      AND sb.recall_date >= v_start_date
      AND (p_end_date IS NULL OR sb.recall_date <= p_end_date)
      AND (p_type = 'all' OR p_type = 'shipment')
  ),
  -- Step 1: 시술 회수 그룹화 (product_summary 없이)
  treatment_recalls_grouped AS (
    SELECT
      (array_agg(h.id ORDER BY h.created_at))[1] AS recall_id,
      'treatment'::TEXT AS recall_type,
      DATE_TRUNC('minute', h.created_at) AS recall_date,
      (array_agg(h.recall_reason ORDER BY h.created_at))[1]::TEXT AS recall_reason,
      COUNT(*)::BIGINT AS quantity,
      o.id AS from_org_id,
      -- FIX: VARCHAR(100) → TEXT 명시적 캐스팅
      o.name::TEXT AS from_org_name,
      o.type::TEXT AS from_org_type,
      -- FIX: VARCHAR(50) → TEXT 명시적 캐스팅
      h.from_owner_id::TEXT AS to_id,
      -- FIX: CASE 문 결과도 TEXT로 명시적 캐스팅
      (CASE
        WHEN LENGTH(h.from_owner_id) >= 7 THEN
          SUBSTRING(h.from_owner_id FROM 1 FOR 3) || '-****-' ||
          SUBSTRING(h.from_owner_id FROM LENGTH(h.from_owner_id) - 3 FOR 4)
        ELSE h.from_owner_id
      END)::TEXT AS to_name,
      'PATIENT'::TEXT AS to_type
    FROM histories h
    JOIN organizations o ON o.id::TEXT = h.to_owner_id
    WHERE h.action_type = 'RECALLED'
      AND h.from_owner_type = 'PATIENT'
      AND h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_type = 'all' OR p_type = 'treatment')
    GROUP BY DATE_TRUNC('minute', h.created_at), o.id, o.name, o.type, h.to_owner_id, h.from_owner_id
  ),
  -- Step 2: 그룹화된 결과에 product_summary 추가
  treatment_recalls_with_products AS (
    SELECT
      tr.recall_id,
      tr.recall_type,
      tr.recall_date,
      tr.recall_reason,
      tr.quantity,
      tr.from_org_id,
      tr.from_org_name,
      tr.from_org_type,
      tr.to_id,
      tr.to_name,
      tr.to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM histories h2
          JOIN virtual_codes vc ON vc.id = h2.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE h2.action_type = 'RECALLED'
            AND h2.from_owner_type = 'PATIENT'
            AND h2.to_owner_id = tr.from_org_id::TEXT
            AND h2.from_owner_id = tr.to_id
            AND DATE_TRUNC('minute', h2.created_at) = tr.recall_date
          GROUP BY p.name
        ) product_counts
      ) AS product_summary
    FROM treatment_recalls_grouped tr
  ),
  all_recalls AS (
    SELECT * FROM shipment_recalls
    UNION ALL
    SELECT * FROM treatment_recalls_with_products
  )
  SELECT
    ar.recall_id,
    ar.recall_type,
    ar.recall_date,
    ar.recall_reason,
    ar.quantity,
    ar.from_org_id,
    ar.from_org_name,
    ar.from_org_type,
    ar.to_id,
    ar.to_name,
    ar.to_type,
    ar.product_summary
  FROM all_recalls ar
  ORDER BY ar.recall_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_offset" integer) IS '회수 이력 통합 조회 (모든 VARCHAR→TEXT 캐스팅, 기본 3일, timeout 30s)';



CREATE OR REPLACE FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_type" "text" DEFAULT 'all'::"text") RETURNS bigint
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "statement_timeout" TO '30s'
    AS $$
DECLARE
  v_count BIGINT := 0;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  -- 출고 회수 개수
  IF p_type = 'all' OR p_type = 'shipment' THEN
    SELECT v_count + COUNT(*)
    INTO v_count
    FROM shipment_batches sb
    WHERE sb.is_recalled = TRUE
      AND sb.recall_date >= v_start_date
      AND (p_end_date IS NULL OR sb.recall_date <= p_end_date);
  END IF;

  -- 시술 회수 개수 (그룹화된 개수)
  IF p_type = 'all' OR p_type = 'treatment' THEN
    SELECT v_count + COUNT(*)
    INTO v_count
    FROM (
      SELECT 1
      FROM histories h
      WHERE h.action_type = 'RECALLED'
        AND h.from_owner_type = 'PATIENT'
        AND h.created_at >= v_start_date
        AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      GROUP BY DATE_TRUNC('minute', h.created_at), h.to_owner_id, h.from_owner_id
    ) grouped;
  END IF;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text") IS '회수 이력 총 개수 조회 (기본 3일, timeout 30s)';



CREATE OR REPLACE FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_type" "text" DEFAULT 'all'::"text", "p_limit" integer DEFAULT 20, "p_cursor_time" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_cursor_key" "text" DEFAULT NULL::"text") RETURNS TABLE("recall_id" "text", "recall_type" "text", "recall_date" timestamp with time zone, "recall_reason" "text", "quantity" bigint, "from_org_id" "text", "from_org_name" "text", "from_org_type" "text", "to_id" "text", "to_name" "text", "to_type" "text", "product_summary" "jsonb", "code_ids" "text"[], "has_more" boolean)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "statement_timeout" TO '30s'
    AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_total_count INT;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH shipment_recalls AS (
    SELECT
      sb.id::TEXT AS recall_id,
      'shipment'::TEXT AS recall_type,
      sb.recall_date AS recall_date,
      sb.recall_reason::TEXT AS recall_reason,
      (
        SELECT COUNT(*)::BIGINT
        FROM shipment_details sd
        WHERE sd.shipment_batch_id = sb.id
      ) AS quantity,
      sb.from_organization_id::TEXT AS from_org_id,
      from_org.name::TEXT AS from_org_name,
      from_org.type::TEXT AS from_org_type,
      sb.to_organization_id::TEXT AS to_id,
      to_org.name::TEXT AS to_name,
      to_org.type::TEXT AS to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM shipment_details sd
          JOIN virtual_codes vc ON vc.id = sd.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE sd.shipment_batch_id = sb.id
          GROUP BY p.name
        ) product_counts
      ) AS product_summary,
      -- 코드 ID 배열 추가
      (
        SELECT ARRAY_AGG(sd.virtual_code_id::TEXT)
        FROM shipment_details sd
        WHERE sd.shipment_batch_id = sb.id
      ) AS code_ids
    FROM shipment_batches sb
    JOIN organizations from_org ON from_org.id = sb.from_organization_id
    LEFT JOIN organizations to_org ON to_org.id = sb.to_organization_id
    WHERE sb.is_recalled = TRUE
      AND sb.recall_date >= v_start_date
      AND (p_end_date IS NULL OR sb.recall_date <= p_end_date)
      AND (p_type = 'all' OR p_type = 'shipment')
  ),
  -- 시술 회수 그룹화
  treatment_recalls_grouped AS (
    SELECT
      (array_agg(h.id::TEXT ORDER BY h.created_at))[1] AS recall_id,
      'treatment'::TEXT AS recall_type,
      DATE_TRUNC('minute', h.created_at) AS recall_date,
      (array_agg(h.recall_reason ORDER BY h.created_at))[1]::TEXT AS recall_reason,
      COUNT(*)::BIGINT AS quantity,
      o.id::TEXT AS from_org_id,
      o.name::TEXT AS from_org_name,
      o.type::TEXT AS from_org_type,
      h.from_owner_id::TEXT AS to_id,
      (CASE
        WHEN LENGTH(h.from_owner_id) >= 7 THEN
          SUBSTRING(h.from_owner_id FROM 1 FOR 3) || '-****-' ||
          SUBSTRING(h.from_owner_id FROM LENGTH(h.from_owner_id) - 3 FOR 4)
        ELSE h.from_owner_id
      END)::TEXT AS to_name,
      'PATIENT'::TEXT AS to_type,
      -- 코드 ID 배열 추가 (시술 회수)
      array_agg(h.virtual_code_id::TEXT ORDER BY h.created_at) AS code_ids
    FROM histories h
    JOIN organizations o ON o.id::TEXT = h.to_owner_id
    WHERE h.action_type = 'RECALLED'
      AND h.from_owner_type = 'PATIENT'
      AND h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_type = 'all' OR p_type = 'treatment')
    GROUP BY DATE_TRUNC('minute', h.created_at), o.id, o.name, o.type, h.to_owner_id, h.from_owner_id
  ),
  -- 시술 회수에 product_summary 추가
  treatment_recalls_with_products AS (
    SELECT
      tr.recall_id,
      tr.recall_type,
      tr.recall_date,
      tr.recall_reason,
      tr.quantity,
      tr.from_org_id,
      tr.from_org_name,
      tr.from_org_type,
      tr.to_id,
      tr.to_name,
      tr.to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM histories h2
          JOIN virtual_codes vc ON vc.id = h2.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE h2.action_type = 'RECALLED'
            AND h2.from_owner_type = 'PATIENT'
            AND h2.to_owner_id = tr.from_org_id
            AND h2.from_owner_id = tr.to_id
            AND DATE_TRUNC('minute', h2.created_at) = tr.recall_date
          GROUP BY p.name
        ) product_counts
      ) AS product_summary,
      tr.code_ids
    FROM treatment_recalls_grouped tr
  ),
  all_recalls AS (
    SELECT * FROM shipment_recalls
    UNION ALL
    SELECT * FROM treatment_recalls_with_products
  ),
  -- 커서 조건 적용 및 정렬
  filtered_recalls AS (
    SELECT
      ar.*,
      ROW_NUMBER() OVER (ORDER BY ar.recall_date DESC, ar.recall_id DESC) AS rn
    FROM all_recalls ar
    WHERE (
      p_cursor_time IS NULL
      OR ar.recall_date < p_cursor_time
      OR (ar.recall_date = p_cursor_time AND ar.recall_id < p_cursor_key)
    )
  )
  SELECT
    fr.recall_id,
    fr.recall_type,
    fr.recall_date,
    fr.recall_reason,
    fr.quantity,
    fr.from_org_id,
    fr.from_org_name,
    fr.from_org_type,
    fr.to_id,
    fr.to_name,
    fr.to_type,
    fr.product_summary,
    fr.code_ids,
    (fr.rn > p_limit) AS has_more
  FROM filtered_recalls fr
  WHERE fr.rn <= p_limit + 1
  ORDER BY fr.recall_date DESC, fr.recall_id DESC
  LIMIT p_limit + 1;
END;
$$;


ALTER FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") IS '회수 이력 통합 조회 (커서 기반 페이지네이션, code_ids 포함)';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats_admin"() RETURNS TABLE("total_organizations" bigint, "pending_approvals" bigint, "today_recalls" bigint, "total_virtual_codes" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 조직 수 (관리자 제외)
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM organizations
      WHERE type != 'ADMIN'
    ) AS total_organizations,

    -- 2. 승인 대기 조직 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM organizations
      WHERE status = 'PENDING_APPROVAL'
        AND type != 'ADMIN'
    ) AS pending_approvals,

    -- 3. 오늘 회수 건수 (출고 회수 + 시술 회수)
    (
      SELECT COALESCE(
        (
          -- 출고 회수
          SELECT COUNT(*)
          FROM shipment_batches
          WHERE is_recalled = TRUE
            AND recall_date >= v_today_start
            AND recall_date < v_today_end
        ) + (
          -- 시술 회수 (histories 테이블에서)
          SELECT COUNT(DISTINCT h.id)
          FROM histories h
          WHERE h.action_type = 'RECALLED'
            AND h.from_owner_type = 'PATIENT'
            AND h.created_at >= v_today_start
            AND h.created_at < v_today_end
        ), 0
      )::BIGINT
    ) AS today_recalls,

    -- 4. 총 가상 코드 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM virtual_codes
    ) AS total_virtual_codes;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats_admin"() IS 'Admin 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") RETURNS TABLE("total_inventory" bigint, "today_received" bigint, "today_shipments" bigint, "unique_products" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 재고량: 현재 보유 중인 가상 코드 수
    (
      SELECT COALESCE(COUNT(vc.id), 0)::BIGINT
      FROM virtual_codes vc
      WHERE vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS total_inventory,

    -- 2. 오늘 입고량: 오늘 수신한 출고의 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.to_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_received,

    -- 3. 오늘 출고량: 오늘 출고된 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.from_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_shipments,

    -- 4. 취급 제품 종류: 현재 재고가 있는 고유 제품 수
    (
      SELECT COALESCE(COUNT(DISTINCT l.product_id), 0)::BIGINT
      FROM virtual_codes vc
      INNER JOIN lots l ON l.id = vc.lot_id
      WHERE vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS unique_products;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") IS '유통사 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") RETURNS TABLE("total_inventory" bigint, "today_received" bigint, "today_treatments" bigint, "unique_patients" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 재고량: 현재 보유 중인 가상 코드 수
    (
      SELECT COALESCE(COUNT(vc.id), 0)::BIGINT
      FROM virtual_codes vc
      WHERE vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS total_inventory,

    -- 2. 오늘 입고량: 오늘 수신한 출고의 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.to_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_received,

    -- 3. 오늘 시술량: 오늘 시술된 가상 코드 수
    (
      SELECT COALESCE(COUNT(td.id), 0)::BIGINT
      FROM treatment_details td
      INNER JOIN treatment_records tr ON tr.id = td.treatment_id
      WHERE tr.hospital_id = p_organization_id
        AND tr.treatment_date >= v_today_start
        AND tr.treatment_date < v_today_end
        AND tr.is_recalled = FALSE
    ) AS today_treatments,

    -- 4. 누적 환자 수: 고유 환자 수
    (
      SELECT COALESCE(COUNT(DISTINCT tr.patient_id), 0)::BIGINT
      FROM treatment_records tr
      WHERE tr.hospital_id = p_organization_id
        AND tr.is_recalled = FALSE
    ) AS unique_patients;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") IS '병원 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") RETURNS TABLE("total_inventory" bigint, "today_production" bigint, "today_shipments" bigint, "active_products" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 재고량: 현재 보유 중인 가상 코드 수
    (
      SELECT COALESCE(COUNT(vc.id), 0)::BIGINT
      FROM virtual_codes vc
      INNER JOIN lots l ON l.id = vc.lot_id
      INNER JOIN products p ON p.id = l.product_id
      WHERE p.organization_id = p_organization_id
        AND vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS total_inventory,

    -- 2. 오늘 생산량: 오늘 생성된 Lot의 수량 합계
    (
      SELECT COALESCE(SUM(l.quantity), 0)::BIGINT
      FROM lots l
      INNER JOIN products p ON p.id = l.product_id
      WHERE p.organization_id = p_organization_id
        AND l.created_at >= v_today_start
        AND l.created_at < v_today_end
    ) AS today_production,

    -- 3. 오늘 출고량: 오늘 출고된 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.from_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_shipments,

    -- 4. 활성 제품 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM products
      WHERE organization_id = p_organization_id
        AND is_active = TRUE
    ) AS active_products;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") IS '제조사 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';



CREATE OR REPLACE FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_is_recall" boolean DEFAULT NULL::boolean, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("group_key" "text", "action_type" character varying, "from_owner_type" character varying, "from_owner_id" character varying, "from_owner_name" "text", "to_owner_type" character varying, "to_owner_id" character varying, "to_owner_name" "text", "is_recall" boolean, "recall_reason" "text", "created_at" timestamp with time zone, "total_quantity" bigint, "product_summaries" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
      h.action_type::TEXT || '_' ||
      COALESCE(h.from_owner_id, '') || '_' ||
      COALESCE(h.to_owner_id, '') AS grp_key,
      h.action_type::TEXT AS act_type,
      h.from_owner_type::TEXT AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type::TEXT AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name,
      ARRAY_AGG(DISTINCT vc.code ORDER BY vc.code) AS codes
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_start_date IS NULL OR h.created_at >= p_start_date)
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
    GROUP BY
      DATE_TRUNC('minute', h.created_at),
      h.action_type,
      h.from_owner_type,
      h.from_owner_id,
      h.to_owner_type,
      h.to_owner_id,
      h.is_recall,
      p.id,
      p.name
  ),
  aggregated AS (
    SELECT
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc,
      MAX(gh.latest_at) AS latest_at,
      -- Cast SUM to BIGINT to match declared return type
      SUM(gh.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'quantity', gh.qty,
          'codes', TO_JSONB(gh.codes)
        )
      ) AS prod_summaries
    FROM grouped_histories gh
    GROUP BY
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc
  )
  SELECT
    a.grp_key,
    a.act_type::VARCHAR,
    a.from_type::VARCHAR,
    a.from_id,
    CASE
      WHEN a.from_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = a.from_id LIMIT 1
      )
      ELSE NULL::TEXT
    END AS from_name,
    a.to_type::VARCHAR,
    a.to_id,
    CASE
      WHEN a.to_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = a.to_id LIMIT 1
      )
      ELSE NULL::TEXT
    END AS to_name,
    a.recall_flag,
    a.recall_desc,
    a.latest_at,
    a.total_qty,
    a.prod_summaries
  FROM aggregated a
  ORDER BY a.latest_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_offset" integer) IS 'Returns grouped transaction history with organization names and product codes.';



CREATE OR REPLACE FUNCTION "public"."get_history_summary_count"("p_organization_id" "uuid", "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_is_recall" boolean DEFAULT NULL::boolean) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT (
    DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
    h.action_type::TEXT || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '')
  ))
  INTO v_count
  FROM histories h
  WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
    AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
    AND (p_start_date IS NULL OR h.created_at >= p_start_date)
    AND (p_end_date IS NULL OR h.created_at <= p_end_date)
    AND (p_is_recall IS NULL OR h.is_recall = p_is_recall);

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_history_summary_count"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[] DEFAULT NULL::"text"[], "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_is_recall" boolean DEFAULT NULL::boolean, "p_limit" integer DEFAULT 50, "p_cursor_time" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_cursor_key" "text" DEFAULT NULL::"text") RETURNS TABLE("group_key" "text", "action_type" character varying, "from_owner_type" character varying, "from_owner_id" character varying, "from_owner_name" "text", "to_owner_type" character varying, "to_owner_id" character varying, "to_owner_name" "text", "is_recall" boolean, "recall_reason" "text", "created_at" timestamp with time zone, "total_quantity" bigint, "product_summaries" "jsonb", "has_more" boolean)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "statement_timeout" TO '30s'
    AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
      h.action_type || '_' ||
      COALESCE(h.from_owner_id, '') || '_' ||
      COALESCE(h.to_owner_id, '') AS grp_key,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name,
      (ARRAY_AGG(h.virtual_code_id ORDER BY h.created_at DESC))[1:10] AS code_ids
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
    GROUP BY
      DATE_TRUNC('minute', h.created_at),
      h.action_type,
      h.from_owner_type,
      h.from_owner_id,
      h.to_owner_type,
      h.to_owner_id,
      h.is_recall,
      p.id,
      p.name
  ),
  aggregated AS (
    SELECT
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc,
      MAX(gh.latest_at) AS latest_at,
      SUM(gh.qty) AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'quantity', gh.qty,
          'codes', gh.code_ids
        )
      ) AS prod_summaries
    FROM grouped_histories gh
    GROUP BY
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.latest_at < p_cursor_time)
      OR (a.latest_at = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.latest_at DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  SELECT
    l.grp_key,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = l.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    l.to_type::VARCHAR,
    l.to_id,
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = l.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    l.recall_flag,
    l.recall_desc,
    l.latest_at,
    l.total_qty,
    l.prod_summaries,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.latest_at DESC, l.grp_key DESC;
END;
$$;


ALTER FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") IS '조직별 이력 요약 커서 기반 페이지네이션 (기본 3일, timeout 30s)';



CREATE OR REPLACE FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying DEFAULT NULL::character varying, "p_limit" integer DEFAULT 10) RETURNS TABLE("phone_number" character varying)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT DISTINCT tr.patient_phone as phone_number
  FROM treatment_records tr
  WHERE tr.hospital_id = p_hospital_id
    AND (p_search_term IS NULL OR tr.patient_phone LIKE '%' || p_search_term || '%')
  ORDER BY phone_number
  LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer) IS '병원별 환자 전화번호 검색 (시술 이력 기반)';



CREATE OR REPLACE FUNCTION "public"."get_inventory_by_lot"("p_product_id" "uuid", "p_owner_id" character varying) RETURNS TABLE("lot_id" "uuid", "lot_number" character varying, "manufacture_date" "date", "expiry_date" "date", "quantity" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.lot_number,
    l.manufacture_date,
    l.expiry_date,
    COUNT(vc.id)
  FROM lots l
  LEFT JOIN virtual_codes vc ON vc.lot_id = l.id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK'
  WHERE l.product_id = p_product_id
  GROUP BY l.id, l.lot_number, l.manufacture_date, l.expiry_date
  HAVING COUNT(vc.id) > 0
  ORDER BY l.manufacture_date ASC, l.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_inventory_by_lot"("p_product_id" "uuid", "p_owner_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) RETURNS TABLE("product_id" "uuid", "lot_id" "uuid", "lot_number" "text", "manufacture_date" "date", "expiry_date" "date", "quantity" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    l.product_id,
    l.id AS lot_id,
    l.lot_number,
    l.manufacture_date,
    l.expiry_date,
    COUNT(vc.id)::BIGINT AS quantity
  FROM lots l
  INNER JOIN virtual_codes vc ON vc.lot_id = l.id
  WHERE
    l.product_id = ANY(p_product_ids)
    AND vc.owner_id = p_owner_id::TEXT
    AND vc.owner_type = 'ORGANIZATION'
    AND vc.status = 'IN_STOCK'
  GROUP BY l.id, l.product_id, l.lot_number, l.manufacture_date, l.expiry_date
  HAVING COUNT(vc.id) > 0
  ORDER BY l.manufacture_date ASC, l.lot_number ASC;
$$;


ALTER FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) IS '여러 제품의 Lot별 재고를 한 번에 조회 (N+1 쿼리 방지용)';



CREATE OR REPLACE FUNCTION "public"."get_inventory_count"("p_product_id" "uuid", "p_owner_id" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK';

  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_inventory_count"("p_product_id" "uuid", "p_owner_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_summary"("p_owner_id" "uuid") RETURNS TABLE("product_id" "uuid", "product_name" "text", "model_name" "text", "udi_di" "text", "quantity" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name::TEXT AS product_name,
    COALESCE(p.model_name, '')::TEXT AS model_name,
    COALESCE(p.udi_di, '')::TEXT AS udi_di,
    COUNT(vc.id) AS quantity
  FROM virtual_codes vc
  INNER JOIN lots l ON l.id = vc.lot_id
  INNER JOIN products p ON p.id = l.product_id
  WHERE vc.owner_id = p_owner_id::VARCHAR
    AND vc.owner_type = 'ORGANIZATION'
    AND vc.status = 'IN_STOCK'
  GROUP BY p.id, p.name, p.model_name, p.udi_di
  ORDER BY p.name, p.model_name;
END;
$$;


ALTER FUNCTION "public"."get_inventory_summary"("p_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_codes_paginated"("p_lot_id" "uuid", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "code" "text", "current_status" "text", "current_owner_name" "text", "current_owner_type" "text", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
BEGIN
  -- 오프셋 계산
  v_offset := (p_page - 1) * p_page_size;

  -- 총 개수 먼저 조회
  SELECT COUNT(*)
  INTO v_total
  FROM virtual_codes vc
  WHERE vc.lot_id = p_lot_id;

  -- 페이지네이션된 결과 반환
  -- 모든 컬럼을 TEXT로 명시적 캐스팅하여 타입 일치 보장
  RETURN QUERY
  SELECT
    vc.id,
    vc.code::TEXT AS code,
    vc.status::TEXT AS current_status,
    (CASE
      WHEN vc.owner_type::TEXT = 'PATIENT' THEN
        CASE
          WHEN LENGTH(vc.owner_id) >= 4 THEN
            '***-****-' || RIGHT(vc.owner_id, 4)
          ELSE vc.owner_id
        END
      WHEN vc.owner_type::TEXT = 'ORGANIZATION' THEN
        COALESCE(o.name::TEXT, '알 수 없음')
      ELSE '알 수 없음'
    END)::TEXT AS current_owner_name,
    vc.owner_type::TEXT AS current_owner_type,
    v_total AS total_count
  FROM virtual_codes vc
  LEFT JOIN organizations o ON vc.owner_type::TEXT = 'ORGANIZATION' AND vc.owner_id = o.id::TEXT
  WHERE vc.lot_id = p_lot_id
  ORDER BY vc.created_at ASC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;


ALTER FUNCTION "public"."get_lot_codes_paginated"("p_lot_id" "uuid", "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notification_stats"("p_organization_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_count" bigint, "auth_count" bigint, "recall_count" bigint, "sent_count" bigint, "pending_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE nm.type = 'AUTHENTICATION') AS auth_count,
    COUNT(*) FILTER (WHERE nm.type = 'RECALL') AS recall_count,
    COUNT(*) FILTER (WHERE nm.status = 'SENT') AS sent_count,
    COUNT(*) FILTER (WHERE nm.status = 'PENDING') AS pending_count
  FROM notification_messages nm
  WHERE p_organization_id IS NULL OR nm.organization_id = p_organization_id;
END;
$$;


ALTER FUNCTION "public"."get_notification_stats"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_patient"("p_phone_number" character varying) RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_normalized_phone VARCHAR;
BEGIN
  v_normalized_phone := regexp_replace(p_phone_number, '[^0-9]', '', 'g');
  INSERT INTO patients (phone_number)
  VALUES (v_normalized_phone)
  ON CONFLICT (phone_number) DO NOTHING;
  RETURN v_normalized_phone;
END;
$$;


ALTER FUNCTION "public"."get_or_create_patient"("p_phone_number" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_code_counts"("p_org_ids" "uuid"[]) RETURNS TABLE("org_id" "uuid", "code_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS org_id,
    COALESCE(COUNT(vc.id), 0)::BIGINT AS code_count
  FROM UNNEST(p_org_ids) AS o(id)
  LEFT JOIN virtual_codes vc ON vc.owner_id = o.id::VARCHAR
    AND vc.status = 'IN_STOCK'
    AND vc.owner_type = 'ORGANIZATION'
  GROUP BY o.id;
END;
$$;


ALTER FUNCTION "public"."get_organization_code_counts"("p_org_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_names"("p_org_ids" "uuid"[]) RETURNS TABLE("org_id" "uuid", "org_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name::TEXT
  FROM organizations o
  WHERE o.id = ANY(p_org_ids);
END;
$$;


ALTER FUNCTION "public"."get_organization_names"("p_org_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_status_counts"() RETURNS TABLE("status" "text", "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    o.status::text,
    COUNT(*)::bigint as count
  FROM organizations o
  WHERE o.type != 'ADMIN'
  GROUP BY o.status
  ORDER BY o.status;
$$;


ALTER FUNCTION "public"."get_organization_status_counts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_status_counts"() IS '조직 상태별 카운트 조회 (관리자 대시보드용). ADMIN 제외, GROUP BY로 집계';



CREATE OR REPLACE FUNCTION "public"."get_received_shipment_history"("p_org_id" "uuid", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20) RETURNS TABLE("batch_id" "uuid", "from_org_id" "uuid", "from_org_name" "text", "shipment_date" timestamp with time zone, "is_recalled" boolean, "recall_reason" "text", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM shipment_batches
  WHERE to_organization_id = p_org_id;

  RETURN QUERY
  SELECT
    sb.id AS batch_id,
    sb.from_organization_id AS from_org_id,
    o.name::TEXT AS from_org_name,
    sb.shipment_date,
    sb.is_recalled,
    sb.recall_reason::TEXT,
    v_total AS total_count
  FROM shipment_batches sb
  JOIN organizations o ON o.id = sb.from_organization_id
  WHERE sb.to_organization_id = p_org_id
  ORDER BY sb.shipment_date DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;


ALTER FUNCTION "public"."get_received_shipment_history"("p_org_id" "uuid", "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shipment_batch_summaries"("p_batch_ids" "uuid"[]) RETURNS TABLE("batch_id" "uuid", "product_id" "uuid", "product_name" "text", "lot_id" "uuid", "lot_number" "text", "quantity" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.shipment_batch_id AS batch_id,
    p.id AS product_id,
    p.name::TEXT AS product_name,
    l.id AS lot_id,
    l.lot_number::TEXT AS lot_number,
    COUNT(sd.id) AS quantity
  FROM shipment_details sd
  JOIN virtual_codes vc ON vc.id = sd.virtual_code_id
  JOIN lots l ON l.id = vc.lot_id
  JOIN products p ON p.id = l.product_id
  WHERE sd.shipment_batch_id = ANY(p_batch_ids)
  GROUP BY sd.shipment_batch_id, p.id, p.name, l.id, l.lot_number
  ORDER BY sd.shipment_batch_id, p.name, l.lot_number;
END;
$$;


ALTER FUNCTION "public"."get_shipment_batch_summaries"("p_batch_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_treatment_summaries"("p_treatment_ids" "uuid"[]) RETURNS TABLE("treatment_id" "uuid", "product_id" "uuid", "product_name" "text", "lot_id" "uuid", "lot_number" "text", "quantity" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.treatment_id AS treatment_id,
    p.id AS product_id,
    p.name::TEXT AS product_name,
    l.id AS lot_id,
    l.lot_number::TEXT AS lot_number,
    COUNT(td.id) AS quantity
  FROM treatment_details td
  JOIN virtual_codes vc ON vc.id = td.virtual_code_id
  JOIN lots l ON l.id = vc.lot_id
  JOIN products p ON p.id = l.product_id
  WHERE td.treatment_id = ANY(p_treatment_ids)
  GROUP BY td.treatment_id, p.id, p.name, l.id, l.lot_number
  ORDER BY td.treatment_id, p.name, l.lot_number;
END;
$$;


ALTER FUNCTION "public"."get_treatment_summaries"("p_treatment_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id FROM organizations WHERE auth_user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organization_type"() RETURNS "public"."organization_type"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT type FROM organizations WHERE auth_user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_organization_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_virtual_code_secret"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT value FROM app_settings WHERE key = 'virtual_code_secret_key');
END;
$$;


ALTER FUNCTION "public"."get_virtual_code_secret"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM virtual_codes vc
    JOIN lots l ON l.id = vc.lot_id
    WHERE l.product_id = p_product_id
      AND vc.owner_id = p_organization_id::VARCHAR
      AND vc.owner_type = 'ORGANIZATION'
      AND vc.status = 'IN_STOCK'
  );
$$;


ALTER FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") IS '특정 조직이 특정 제품의 재고를 보유하고 있는지 확인 (RLS 우회)';



CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM organizations
    WHERE auth_user_id = auth.uid() AND type = 'ADMIN'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_shipment_date TIMESTAMPTZ;
  v_is_recalled BOOLEAN;
BEGIN
  SELECT shipment_date, is_recalled
  INTO v_shipment_date, v_is_recalled
  FROM shipment_batches
  WHERE id = p_shipment_batch_id;

  -- Not found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already recalled
  IF v_is_recalled THEN
    RETURN FALSE;
  END IF;

  -- Check 24-hour limit
  RETURN (NOW() - v_shipment_date) <= INTERVAL '24 hours';
END;
$$;


ALTER FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_inactive_product_usage"("p_usage_type" character varying, "p_usage_id" "uuid", "p_product_id" "uuid", "p_organization_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_product RECORD;
  v_org RECORD;
  v_manufacturer_org RECORD;
  v_admin_orgs UUID[];
  v_admin_org_id UUID;
  v_alert_title VARCHAR;
  v_alert_content TEXT;
BEGIN
  -- 제품 정보 조회
  SELECT p.*, o.name AS manufacturer_name, o.id AS manufacturer_org_id
  INTO v_product
  FROM products p
  JOIN organizations o ON p.organization_id = o.id
  WHERE p.id = p_product_id;

  -- 제품이 활성 상태면 종료
  IF v_product.is_active = TRUE THEN
    RETURN;
  END IF;

  -- 사용 조직 정보 조회
  SELECT * INTO v_org
  FROM organizations
  WHERE id = p_organization_id;

  -- 사용 로그 기록
  INSERT INTO inactive_product_usage_logs (
    usage_type,
    usage_id,
    product_id,
    product_name,
    deactivation_reason,
    organization_id,
    organization_name,
    manufacturer_org_id,
    quantity
  ) VALUES (
    p_usage_type,
    p_usage_id,
    p_product_id,
    v_product.name,
    COALESCE(v_product.deactivation_reason, 'DISCONTINUED'),
    p_organization_id,
    v_org.name,
    v_product.manufacturer_org_id,
    p_quantity
  );

  -- 알림 제목/내용 생성
  v_alert_title := CASE
    WHEN v_product.deactivation_reason = 'SAFETY_ISSUE' THEN '[긴급] 안전 문제 제품 사용 감지'
    WHEN v_product.deactivation_reason = 'QUALITY_ISSUE' THEN '[주의] 품질 문제 제품 사용 감지'
    ELSE '비활성 제품 사용 감지'
  END;

  v_alert_content := format(
    '%s이(가) 비활성 제품 "%s"을(를) %s에 사용했습니다. (수량: %s개, 사유: %s)',
    v_org.name,
    v_product.name,
    CASE WHEN p_usage_type = 'SHIPMENT' THEN '출고' ELSE '시술' END,
    p_quantity,
    CASE v_product.deactivation_reason
      WHEN 'DISCONTINUED' THEN '단종'
      WHEN 'SAFETY_ISSUE' THEN '안전 문제'
      WHEN 'QUALITY_ISSUE' THEN '품질 문제'
      ELSE '기타'
    END
  );

  -- 관리자 조직들에게 알림 생성
  SELECT ARRAY_AGG(id) INTO v_admin_orgs
  FROM organizations
  WHERE type = 'ADMIN' AND status = 'ACTIVE';

  IF v_admin_orgs IS NOT NULL THEN
    FOREACH v_admin_org_id IN ARRAY v_admin_orgs
    LOOP
      INSERT INTO organization_alerts (
        alert_type,
        recipient_org_id,
        title,
        content,
        metadata
      ) VALUES (
        'INACTIVE_PRODUCT_USAGE',
        v_admin_org_id,
        v_alert_title,
        v_alert_content,
        jsonb_build_object(
          'productId', p_product_id,
          'productName', v_product.name,
          'usageType', p_usage_type,
          'usageId', p_usage_id,
          'quantity', p_quantity,
          'organizationId', p_organization_id,
          'organizationName', v_org.name,
          'deactivationReason', v_product.deactivation_reason
        )
      );
    END LOOP;
  END IF;

  -- 제조사에게 알림 생성
  INSERT INTO organization_alerts (
    alert_type,
    recipient_org_id,
    title,
    content,
    metadata
  ) VALUES (
    'INACTIVE_PRODUCT_USAGE',
    v_product.manufacturer_org_id,
    v_alert_title,
    v_alert_content,
    jsonb_build_object(
      'productId', p_product_id,
      'productName', v_product.name,
      'usageType', p_usage_type,
      'usageId', p_usage_id,
      'quantity', p_quantity,
      'organizationId', p_organization_id,
      'organizationName', v_org.name,
      'deactivationReason', v_product.deactivation_reason
    )
  );

END;
$$;


ALTER FUNCTION "public"."log_inactive_product_usage"("p_usage_type" character varying, "p_usage_id" "uuid", "p_product_id" "uuid", "p_organization_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_phone_number"("phone" character varying) RETURNS character varying
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
END;
$$;


ALTER FUNCTION "public"."normalize_phone_number"("phone" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recall_shipment_atomic"("p_shipment_batch_id" "uuid", "p_reason" character varying) RETURNS TABLE("success" boolean, "recalled_count" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_from_org_id UUID;
  v_batch RECORD;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_batch FROM shipment_batches WHERE id = p_shipment_batch_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR,
      '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.from_organization_id != v_from_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '발송자만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR,
      '이미 회수된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_batch.shipment_date) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR,
      '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  UPDATE virtual_codes
  SET owner_id = v_from_org_id::VARCHAR, owner_type = 'ORGANIZATION'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE shipment_batches
  SET is_recalled = TRUE, recall_reason = p_reason, recall_date = NOW()
  WHERE id = p_shipment_batch_id;

  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, shipment_batch_id, is_recall, recall_reason
    ) VALUES (
      v_code_id, 'RECALLED', 'ORGANIZATION', v_batch.to_organization_id::VARCHAR,
      'ORGANIZATION', v_from_org_id::VARCHAR, p_shipment_batch_id, TRUE, p_reason
    );
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;


ALTER FUNCTION "public"."recall_shipment_atomic"("p_shipment_batch_id" "uuid", "p_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recall_shipment_atomic"("p_from_org_id" "uuid", "p_shipment_batch_id" "uuid", "p_reason" character varying) RETURNS TABLE("success" boolean, "recalled_count" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_batch RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  -- Get batch info with lock
  SELECT * INTO v_batch
  FROM shipment_batches
  WHERE id = p_shipment_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR, '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check ownership
  IF v_batch.from_organization_id != p_from_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '발송자만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check if already recalled
  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR, '이미 회수된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour limit
  IF (NOW() - v_batch.shipment_date) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code IDs for this batch
  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- BULK UPDATE: ownership back to sender
  UPDATE virtual_codes
  SET owner_id = p_from_org_id::VARCHAR,
      owner_type = 'ORGANIZATION'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update batch as recalled
  UPDATE shipment_batches
  SET is_recalled = TRUE,
      recall_reason = p_reason,
      recall_date = NOW()
  WHERE id = p_shipment_batch_id;

  -- BULK INSERT: recall history
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    shipment_batch_id,
    is_recall,
    recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'RECALLED'::history_action_type,
    'ORGANIZATION'::owner_type,
    v_batch.to_organization_id::VARCHAR,
    'ORGANIZATION'::owner_type,
    p_from_org_id::VARCHAR,
    p_shipment_batch_id,
    TRUE,
    p_reason;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;


ALTER FUNCTION "public"."recall_shipment_atomic"("p_from_org_id" "uuid", "p_shipment_batch_id" "uuid", "p_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recall_treatment_atomic"("p_treatment_id" "uuid", "p_reason" character varying) RETURNS TABLE("success" boolean, "recalled_count" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_hospital_id UUID;
  v_treatment RECORD;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_treatment FROM treatment_records WHERE id = p_treatment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR,
      '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.hospital_id != v_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR,
      '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  UPDATE virtual_codes
  SET owner_id = v_hospital_id::VARCHAR, owner_type = 'ORGANIZATION', status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, is_recall, recall_reason
    ) VALUES (
      v_code_id, 'RECALLED', 'PATIENT', v_treatment.patient_phone,
      'ORGANIZATION', v_hospital_id::VARCHAR, TRUE, p_reason
    );
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;


ALTER FUNCTION "public"."recall_treatment_atomic"("p_treatment_id" "uuid", "p_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recall_treatment_atomic"("p_hospital_id" "uuid", "p_treatment_id" "uuid", "p_reason" character varying) RETURNS TABLE("success" boolean, "recalled_count" integer, "error_code" character varying, "error_message" character varying)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_treatment RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  -- Get treatment info with lock
  SELECT * INTO v_treatment
  FROM treatment_records
  WHERE id = p_treatment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check ownership
  IF v_treatment.hospital_id != p_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour limit (using created_at)
  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code IDs for this treatment
  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- BULK UPDATE: ownership back to hospital and status to IN_STOCK
  UPDATE virtual_codes
  SET owner_id = p_hospital_id::VARCHAR,
      owner_type = 'ORGANIZATION',
      status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete treatment details
  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;

  -- Delete treatment record
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  -- BULK INSERT: recall history
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    is_recall,
    recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'RECALLED'::history_action_type,
    'PATIENT'::owner_type,
    v_treatment.patient_phone,
    'ORGANIZATION'::owner_type,
    p_hospital_id::VARCHAR,
    TRUE,
    p_reason;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;


ALTER FUNCTION "public"."recall_treatment_atomic"("p_hospital_id" "uuid", "p_treatment_id" "uuid", "p_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_production_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id
  ) VALUES (
    NEW.id,
    'PRODUCED',
    'ORGANIZATION',
    NEW.owner_id,  -- Manufacturer
    'ORGANIZATION',
    NEW.owner_id   -- Same (produced and owned by manufacturer)
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_production_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_virtual_code_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_action_type history_action_type;
BEGIN
  -- Determine action type based on changes
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    -- Ownership changed
    IF OLD.status = 'IN_STOCK' AND NEW.status = 'USED' THEN
      v_action_type := 'TREATED';
    ELSIF NEW.owner_type = 'PATIENT' THEN
      v_action_type := 'TREATED';
    ELSE
      -- Regular shipment (SHIPPED for sender perspective)
      v_action_type := 'SHIPPED';
    END IF;

    INSERT INTO histories (
      virtual_code_id,
      action_type,
      from_owner_type,
      from_owner_id,
      to_owner_type,
      to_owner_id
    ) VALUES (
      NEW.id,
      v_action_type,
      OLD.owner_type,
      OLD.owner_id,
      NEW.owner_type,
      NEW.owner_id
    );
  END IF;

  -- Status change to DISPOSED
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'DISPOSED' THEN
    INSERT INTO histories (
      virtual_code_id,
      action_type,
      from_owner_type,
      from_owner_id,
      to_owner_type,
      to_owner_id
    ) VALUES (
      NEW.id,
      'DISPOSED',
      OLD.owner_type,
      OLD.owner_id,
      NEW.owner_type,
      NEW.owner_id
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_virtual_code_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."select_fifo_codes"("p_product_id" "uuid", "p_owner_id" character varying, "p_quantity" integer, "p_lot_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("virtual_code_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT vc.id
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.status = 'IN_STOCK'
    AND vc.owner_id = p_owner_id
    AND (p_lot_id IS NULL OR vc.lot_id = p_lot_id)
  ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
  LIMIT p_quantity
  FOR UPDATE OF vc SKIP LOCKED;
END;
$$;


ALTER FUNCTION "public"."select_fifo_codes"("p_product_id" "uuid", "p_owner_id" character varying, "p_quantity" integer, "p_lot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_lot"("p_product_id" "uuid", "p_lot_number" character varying, "p_quantity" integer, "p_manufacture_date" "date", "p_expiry_date" "date") RETURNS TABLE("lot_id" "uuid", "lot_number" character varying, "total_quantity" integer, "is_new" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_existing_lot_id UUID;
  v_existing_quantity INT;
  v_manufacturer_id UUID;
  v_new_quantity INT;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Get manufacturer ID
  SELECT organization_id INTO v_manufacturer_id
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Check existing Lot
  SELECT l.id, l.quantity
  INTO v_existing_lot_id, v_existing_quantity
  FROM lots l
  WHERE l.product_id = p_product_id
    AND l.lot_number = p_lot_number;

  IF FOUND THEN
    -- Add quantity to existing Lot
    v_new_quantity := v_existing_quantity + p_quantity;

    -- Maximum quantity check
    IF v_new_quantity > 100000 THEN
      RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
        v_existing_quantity, p_quantity, v_new_quantity;
    END IF;

    -- Update quantity
    UPDATE lots SET quantity = v_new_quantity WHERE id = v_existing_lot_id;

    -- BULK INSERT: Generate virtual_codes in single query
    INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
    SELECT
      generate_virtual_code(),
      v_existing_lot_id,
      'IN_STOCK',
      'ORGANIZATION',
      v_manufacturer_id::VARCHAR
    FROM generate_series(1, p_quantity);

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, v_new_quantity, FALSE;
  ELSE
    -- Create new Lot
    INSERT INTO lots (product_id, lot_number, quantity, manufacture_date, expiry_date)
    VALUES (p_product_id, p_lot_number, p_quantity, p_manufacture_date, p_expiry_date)
    RETURNING id INTO v_existing_lot_id;

    -- Trigger will auto-generate virtual_codes
    v_is_new := TRUE;

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, p_quantity, TRUE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."upsert_lot"("p_product_id" "uuid", "p_lot_number" character varying, "p_quantity" integer, "p_manufacture_date" "date", "p_expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_lot_manufacturer"("lot_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM lots l
    JOIN products p ON l.product_id = p.id
    WHERE l.id = lot_uuid
    AND p.organization_id = get_user_organization_id()
  );
$$;


ALTER FUNCTION "public"."user_is_lot_manufacturer"("lot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_codes_in_lot"("lot_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM virtual_codes
    WHERE lot_id = lot_uuid
    AND owner_id = get_user_organization_id()::VARCHAR
    AND owner_type = 'ORGANIZATION'
  );
$$;


ALTER FUNCTION "public"."user_owns_codes_in_lot"("lot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_business_number"("bn" character varying) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
  RETURN bn ~ '^[0-9]{10}$';
END;
$_$;


ALTER FUNCTION "public"."validate_business_number"("bn" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_virtual_code"("code" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  payload VARCHAR;
  provided_sig VARCHAR;
  expected_sig VARCHAR;
BEGIN
  -- 형식 검증: NC-XXXXXXXX-XXXX (16자)
  IF LENGTH(code) != 16 OR NOT code ~ '^NC-[A-Z0-9]{8}-[A-Z0-9]{4}$' THEN
    -- 구형식(NC-XXXXXXXX, 11자)이거나 잘못된 형식
    RETURN FALSE;
  END IF;

  -- 페이로드 추출 (4~11자: A3F8B2C1)
  payload := SUBSTRING(code FROM 4 FOR 8);

  -- 제공된 서명 추출 (13~16자: X7K2)
  provided_sig := SUBSTRING(code FROM 13 FOR 4);

  -- 예상 서명 계산
  expected_sig := generate_hmac_signature(payload);

  -- 서명 비교
  RETURN provided_sig = expected_sig;
END;
$_$;


ALTER FUNCTION "public"."verify_virtual_code"("code" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" character varying(100) NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."histories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "virtual_code_id" "uuid" NOT NULL,
    "action_type" "public"."history_action_type" NOT NULL,
    "from_owner_type" "public"."owner_type" NOT NULL,
    "from_owner_id" character varying(50) NOT NULL,
    "to_owner_type" "public"."owner_type" NOT NULL,
    "to_owner_id" character varying(50) NOT NULL,
    "shipment_batch_id" "uuid",
    "is_recall" boolean DEFAULT false NOT NULL,
    "recall_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_history_recall_consistency" CHECK (((("is_recall" = false) AND ("recall_reason" IS NULL)) OR (("is_recall" = true) AND ("recall_reason" IS NOT NULL))))
);


ALTER TABLE "public"."histories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inactive_product_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usage_type" character varying(20) NOT NULL,
    "usage_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_name" character varying(100) NOT NULL,
    "deactivation_reason" "public"."product_deactivation_reason" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "organization_name" character varying(100) NOT NULL,
    "manufacturer_org_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    CONSTRAINT "inactive_product_usage_logs_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "inactive_product_usage_logs_usage_type_check" CHECK ((("usage_type")::"text" = ANY ((ARRAY['SHIPMENT'::character varying, 'TREATMENT'::character varying])::"text"[])))
);


ALTER TABLE "public"."inactive_product_usage_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."inactive_product_usage_logs" IS '비활성 제품 사용 이력 (출고/시술 시 비활성 제품 사용 기록)';



COMMENT ON COLUMN "public"."inactive_product_usage_logs"."usage_type" IS '사용 유형: SHIPMENT(출고) or TREATMENT(시술)';



COMMENT ON COLUMN "public"."inactive_product_usage_logs"."usage_id" IS '출고 배치 ID 또는 시술 기록 ID';



COMMENT ON COLUMN "public"."inactive_product_usage_logs"."acknowledged_at" IS '관리자 확인 일시';



COMMENT ON COLUMN "public"."inactive_product_usage_logs"."acknowledged_by" IS '확인 처리한 관리자 조직 ID';



CREATE TABLE IF NOT EXISTS "public"."lots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "lot_number" character varying(50) NOT NULL,
    "quantity" integer NOT NULL,
    "manufacture_date" "date" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_lot_expiry_after_manufacture" CHECK (("expiry_date" > "manufacture_date")),
    CONSTRAINT "chk_lot_quantity" CHECK ((("quantity" >= 1) AND ("quantity" <= 100000)))
);


ALTER TABLE "public"."lots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manufacturer_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "lot_prefix" character varying(10) DEFAULT 'ND'::character varying NOT NULL,
    "lot_model_digits" smallint DEFAULT 5 NOT NULL,
    "lot_date_format" character varying(20) DEFAULT 'yymmdd'::character varying NOT NULL,
    "expiry_months" smallint DEFAULT 24 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_expiry_months" CHECK (("expiry_months" = ANY (ARRAY[6, 12, 18, 24, 30, 36]))),
    CONSTRAINT "chk_lot_model_digits" CHECK ((("lot_model_digits" >= 1) AND ("lot_model_digits" <= 10)))
);


ALTER TABLE "public"."manufacturer_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "patient_phone" character varying(15) NOT NULL,
    "content" "text" NOT NULL,
    "is_sent" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "public"."organization_alert_type" NOT NULL,
    "recipient_org_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_alerts" IS '조직 간 알림 테이블 (비활성 제품 사용 알림, 시스템 공지 등)';



COMMENT ON COLUMN "public"."organization_alerts"."alert_type" IS '알림 유형';



COMMENT ON COLUMN "public"."organization_alerts"."recipient_org_id" IS '수신 조직 ID';



COMMENT ON COLUMN "public"."organization_alerts"."metadata" IS '관련 데이터 (JSON)';



COMMENT ON COLUMN "public"."organization_alerts"."is_read" IS '읽음 여부';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "type" "public"."organization_type" NOT NULL,
    "email" character varying(255) NOT NULL,
    "business_number" character varying(10) NOT NULL,
    "business_license_file" character varying(500) NOT NULL,
    "name" character varying(100) NOT NULL,
    "representative_name" character varying(50) NOT NULL,
    "representative_contact" character varying(20) NOT NULL,
    "address" "text" NOT NULL,
    "status" "public"."organization_status" DEFAULT 'PENDING_APPROVAL'::"public"."organization_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_business_number_format" CHECK ((("business_number")::"text" ~ '^[0-9]{10}$'::"text")),
    CONSTRAINT "chk_email_format" CHECK ((("email")::"text" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "phone_number" character varying(15) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_phone_number_format" CHECK ((("phone_number")::"text" ~ '^[0-9]{10,15}$'::"text"))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "udi_di" character varying(100) NOT NULL,
    "model_name" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deactivation_reason" "public"."product_deactivation_reason",
    "deactivation_note" "text",
    "deactivated_at" timestamp with time zone
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."deactivation_reason" IS '비활성화 사유: DISCONTINUED(단종), SAFETY_ISSUE(안전문제), QUALITY_ISSUE(품질문제), OTHER(기타)';



COMMENT ON COLUMN "public"."products"."deactivation_note" IS '비활성화 상세 사유 (선택)';



COMMENT ON COLUMN "public"."products"."deactivated_at" IS '비활성화 일시';



CREATE TABLE IF NOT EXISTS "public"."shipment_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_organization_id" "uuid" NOT NULL,
    "to_organization_type" "public"."organization_type" NOT NULL,
    "to_organization_id" "uuid" NOT NULL,
    "shipment_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_recalled" boolean DEFAULT false NOT NULL,
    "recall_reason" "text",
    "recall_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_no_self_shipment" CHECK (("from_organization_id" <> "to_organization_id")),
    CONSTRAINT "chk_recall_consistency" CHECK (((("is_recalled" = false) AND ("recall_reason" IS NULL) AND ("recall_date" IS NULL)) OR (("is_recalled" = true) AND ("recall_reason" IS NOT NULL) AND ("recall_date" IS NOT NULL))))
);


ALTER TABLE "public"."shipment_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_batch_id" "uuid" NOT NULL,
    "virtual_code_id" "uuid" NOT NULL
);


ALTER TABLE "public"."shipment_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "treatment_id" "uuid" NOT NULL,
    "virtual_code_id" "uuid" NOT NULL
);


ALTER TABLE "public"."treatment_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hospital_id" "uuid" NOT NULL,
    "patient_phone" character varying(15) NOT NULL,
    "treatment_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."virtual_code_verification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "verification_result" boolean NOT NULL,
    "context" character varying(50),
    "context_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."virtual_code_verification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."virtual_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "lot_id" "uuid" NOT NULL,
    "status" "public"."virtual_code_status" DEFAULT 'IN_STOCK'::"public"."virtual_code_status" NOT NULL,
    "owner_type" "public"."owner_type" DEFAULT 'ORGANIZATION'::"public"."owner_type" NOT NULL,
    "owner_id" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."virtual_codes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."histories"
    ADD CONSTRAINT "histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inactive_product_usage_logs"
    ADD CONSTRAINT "inactive_product_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manufacturer_settings"
    ADD CONSTRAINT "manufacturer_settings_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."manufacturer_settings"
    ADD CONSTRAINT "manufacturer_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_messages"
    ADD CONSTRAINT "notification_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_alerts"
    ADD CONSTRAINT "organization_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_business_number_key" UNIQUE ("business_number");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("phone_number");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_batches"
    ADD CONSTRAINT "shipment_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_details"
    ADD CONSTRAINT "shipment_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_details"
    ADD CONSTRAINT "treatment_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_records"
    ADD CONSTRAINT "treatment_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "uq_lots_product_lot_number" UNIQUE ("product_id", "lot_number");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "uq_products_org_udi_di" UNIQUE ("organization_id", "udi_di");



ALTER TABLE ONLY "public"."shipment_details"
    ADD CONSTRAINT "uq_shipment_details_batch_code" UNIQUE ("shipment_batch_id", "virtual_code_id");



ALTER TABLE ONLY "public"."treatment_details"
    ADD CONSTRAINT "uq_treatment_details_treatment_code" UNIQUE ("treatment_id", "virtual_code_id");



ALTER TABLE ONLY "public"."virtual_code_verification_logs"
    ADD CONSTRAINT "virtual_code_verification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."virtual_codes"
    ADD CONSTRAINT "virtual_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."virtual_codes"
    ADD CONSTRAINT "virtual_codes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_histories_action" ON "public"."histories" USING "btree" ("action_type");



CREATE INDEX "idx_histories_created" ON "public"."histories" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_histories_created_action" ON "public"."histories" USING "btree" ("created_at" DESC, "action_type");



CREATE INDEX "idx_histories_created_action_from" ON "public"."histories" USING "btree" ("created_at" DESC, "action_type", "from_owner_id");



COMMENT ON INDEX "public"."idx_histories_created_action_from" IS 'RPC 성능 최적화: created_at 범위 + action_type + from_owner_id 필터';



CREATE INDEX "idx_histories_created_action_to" ON "public"."histories" USING "btree" ("created_at" DESC, "action_type", "to_owner_id");



COMMENT ON INDEX "public"."idx_histories_created_action_to" IS 'RPC 성능 최적화: created_at 범위 + action_type + to_owner_id 필터';



CREATE INDEX "idx_histories_from_org_time" ON "public"."histories" USING "btree" ("from_owner_id", "created_at" DESC) WHERE ("from_owner_type" = 'ORGANIZATION'::"public"."owner_type");



CREATE INDEX "idx_histories_from_owner" ON "public"."histories" USING "btree" ("from_owner_type", "from_owner_id");



CREATE INDEX "idx_histories_from_owner_time" ON "public"."histories" USING "btree" ("from_owner_id", "created_at" DESC) WHERE ("from_owner_type" = 'ORGANIZATION'::"public"."owner_type");



CREATE INDEX "idx_histories_minute_action" ON "public"."histories" USING "btree" ("public"."date_trunc_minute_immutable"("created_at"), "action_type");



CREATE INDEX "idx_histories_org_action_time" ON "public"."histories" USING "btree" ("from_owner_id", "action_type", "created_at" DESC) WHERE ("from_owner_type" = 'ORGANIZATION'::"public"."owner_type");



COMMENT ON INDEX "public"."idx_histories_org_action_time" IS '조직별 이력 조회 최적화 (get_history_summary). from_owner 기준, 액션타입+시간순';



CREATE INDEX "idx_histories_recall" ON "public"."histories" USING "btree" ("is_recall") WHERE ("is_recall" = true);



CREATE INDEX "idx_histories_recall_time" ON "public"."histories" USING "btree" ("created_at" DESC) WHERE ("is_recall" = true);



CREATE INDEX "idx_histories_recalled_patient" ON "public"."histories" USING "btree" ("created_at" DESC, "to_owner_id", "from_owner_id") WHERE (("action_type" = 'RECALLED'::"public"."history_action_type") AND ("from_owner_type" = 'PATIENT'::"public"."owner_type"));



COMMENT ON INDEX "public"."idx_histories_recalled_patient" IS '시술 회수 조회 최적화: RECALLED + PATIENT 조건 (Partial Index)';



CREATE INDEX "idx_histories_shipment" ON "public"."histories" USING "btree" ("shipment_batch_id") WHERE ("shipment_batch_id" IS NOT NULL);



CREATE INDEX "idx_histories_to_org_action_time" ON "public"."histories" USING "btree" ("to_owner_id", "action_type", "created_at" DESC) WHERE ("to_owner_type" = 'ORGANIZATION'::"public"."owner_type");



COMMENT ON INDEX "public"."idx_histories_to_org_action_time" IS '수신자 기준 이력 조회 최적화 (입고 이력). to_owner 기준, 액션타입+시간순';



CREATE INDEX "idx_histories_to_org_time" ON "public"."histories" USING "btree" ("to_owner_id", "created_at" DESC) WHERE ("to_owner_type" = 'ORGANIZATION'::"public"."owner_type");



CREATE INDEX "idx_histories_to_owner" ON "public"."histories" USING "btree" ("to_owner_type", "to_owner_id");



CREATE INDEX "idx_histories_to_owner_time" ON "public"."histories" USING "btree" ("to_owner_id", "created_at" DESC) WHERE ("to_owner_type" = 'ORGANIZATION'::"public"."owner_type");



CREATE INDEX "idx_histories_virtual_code" ON "public"."histories" USING "btree" ("virtual_code_id");



CREATE INDEX "idx_inactive_usage_logs_created_at" ON "public"."inactive_product_usage_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inactive_usage_logs_manufacturer" ON "public"."inactive_product_usage_logs" USING "btree" ("manufacturer_org_id", "created_at" DESC);



CREATE INDEX "idx_inactive_usage_logs_product" ON "public"."inactive_product_usage_logs" USING "btree" ("product_id");



CREATE INDEX "idx_inactive_usage_logs_unacknowledged" ON "public"."inactive_product_usage_logs" USING "btree" ("acknowledged_at") WHERE ("acknowledged_at" IS NULL);



CREATE INDEX "idx_lots_created_product" ON "public"."lots" USING "btree" ("created_at" DESC, "product_id");



COMMENT ON INDEX "public"."idx_lots_created_product" IS '생산량 조회 최적화 (대시보드). 생성일+제품ID 복합 인덱스';



CREATE INDEX "idx_lots_expiry_date" ON "public"."lots" USING "btree" ("expiry_date");



CREATE INDEX "idx_lots_fifo" ON "public"."lots" USING "btree" ("product_id", "manufacture_date", "created_at");



CREATE INDEX "idx_lots_manufacture_date" ON "public"."lots" USING "btree" ("manufacture_date");



CREATE INDEX "idx_lots_product" ON "public"."lots" USING "btree" ("product_id");



CREATE INDEX "idx_lots_product_lot_number" ON "public"."lots" USING "btree" ("product_id", "lot_number");



CREATE INDEX "idx_notifications_created" ON "public"."notification_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_patient" ON "public"."notification_messages" USING "btree" ("patient_phone");



CREATE INDEX "idx_notifications_type" ON "public"."notification_messages" USING "btree" ("type");



CREATE INDEX "idx_notifications_unsent" ON "public"."notification_messages" USING "btree" ("created_at") WHERE ("is_sent" = false);



CREATE INDEX "idx_org_alerts_created_at" ON "public"."organization_alerts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_org_alerts_recipient_unread" ON "public"."organization_alerts" USING "btree" ("recipient_org_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_org_alerts_type" ON "public"."organization_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_organizations_auth_user" ON "public"."organizations" USING "btree" ("auth_user_id") WHERE ("auth_user_id" IS NOT NULL);



CREATE INDEX "idx_organizations_business_number" ON "public"."organizations" USING "btree" ("business_number");



CREATE INDEX "idx_organizations_status" ON "public"."organizations" USING "btree" ("status");



CREATE INDEX "idx_organizations_type" ON "public"."organizations" USING "btree" ("type");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("organization_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_products_is_active_reason" ON "public"."products" USING "btree" ("is_active", "deactivation_reason") WHERE ("is_active" = false);



CREATE INDEX "idx_products_organization" ON "public"."products" USING "btree" ("organization_id");



CREATE INDEX "idx_products_udi_di" ON "public"."products" USING "btree" ("udi_di");



CREATE INDEX "idx_shipment_batches_date" ON "public"."shipment_batches" USING "btree" ("shipment_date" DESC);



CREATE INDEX "idx_shipment_batches_from_org" ON "public"."shipment_batches" USING "btree" ("from_organization_id");



CREATE INDEX "idx_shipment_batches_recall_date" ON "public"."shipment_batches" USING "btree" ("recall_date" DESC) WHERE ("is_recalled" = true);



COMMENT ON INDEX "public"."idx_shipment_batches_recall_date" IS '회수 조회 최적화: 회수된 출고 건만 인덱싱 (Partial Index)';



CREATE INDEX "idx_shipment_batches_recallable" ON "public"."shipment_batches" USING "btree" ("from_organization_id", "shipment_date") WHERE ("is_recalled" = false);



CREATE INDEX "idx_shipment_batches_recalled" ON "public"."shipment_batches" USING "btree" ("is_recalled");



CREATE INDEX "idx_shipment_batches_to_org" ON "public"."shipment_batches" USING "btree" ("to_organization_id");



CREATE INDEX "idx_shipment_details_batch" ON "public"."shipment_details" USING "btree" ("shipment_batch_id");



CREATE INDEX "idx_shipment_details_code" ON "public"."shipment_details" USING "btree" ("virtual_code_id");



CREATE INDEX "idx_treatment_details_code" ON "public"."treatment_details" USING "btree" ("virtual_code_id");



CREATE INDEX "idx_treatment_details_treatment" ON "public"."treatment_details" USING "btree" ("treatment_id");



CREATE INDEX "idx_treatment_records_date" ON "public"."treatment_records" USING "btree" ("treatment_date" DESC);



CREATE INDEX "idx_treatment_records_hospital" ON "public"."treatment_records" USING "btree" ("hospital_id");



CREATE INDEX "idx_treatment_records_hospital_date" ON "public"."treatment_records" USING "btree" ("hospital_id", "treatment_date" DESC);



CREATE INDEX "idx_treatment_records_patient" ON "public"."treatment_records" USING "btree" ("patient_phone");



CREATE INDEX "idx_verification_logs_code" ON "public"."virtual_code_verification_logs" USING "btree" ("code");



CREATE INDEX "idx_verification_logs_result" ON "public"."virtual_code_verification_logs" USING "btree" ("verification_result", "created_at" DESC);



CREATE INDEX "idx_virtual_codes_code" ON "public"."virtual_codes" USING "btree" ("code");



CREATE INDEX "idx_virtual_codes_inventory" ON "public"."virtual_codes" USING "btree" ("owner_id", "status") WHERE ("status" = 'IN_STOCK'::"public"."virtual_code_status");



CREATE INDEX "idx_virtual_codes_lot" ON "public"."virtual_codes" USING "btree" ("lot_id");



CREATE INDEX "idx_virtual_codes_owner" ON "public"."virtual_codes" USING "btree" ("owner_type", "owner_id");



CREATE INDEX "idx_virtual_codes_owner_lot_status" ON "public"."virtual_codes" USING "btree" ("owner_id", "lot_id", "status") WHERE (("owner_type" = 'ORGANIZATION'::"public"."owner_type") AND ("status" = 'IN_STOCK'::"public"."virtual_code_status"));



COMMENT ON INDEX "public"."idx_virtual_codes_owner_lot_status" IS '조직별 재고 상세 조회 최적화. owner+lot+status 복합 인덱스';



CREATE INDEX "idx_virtual_codes_owner_status_lot" ON "public"."virtual_codes" USING "btree" ("owner_id", "status", "lot_id") WHERE ("status" = 'IN_STOCK'::"public"."virtual_code_status");



CREATE INDEX "idx_virtual_codes_status" ON "public"."virtual_codes" USING "btree" ("status");



CREATE INDEX "idx_virtual_codes_stock_fifo" ON "public"."virtual_codes" USING "btree" ("lot_id", "status", "created_at") WHERE ("status" = 'IN_STOCK'::"public"."virtual_code_status");



CREATE OR REPLACE TRIGGER "trg_lot_create_virtual_codes" AFTER INSERT ON "public"."lots" FOR EACH ROW EXECUTE FUNCTION "public"."create_virtual_codes_for_lot"();



CREATE OR REPLACE TRIGGER "trg_lots_updated_at" BEFORE UPDATE ON "public"."lots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_manufacturer_settings_updated_at" BEFORE UPDATE ON "public"."manufacturer_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_notification_ensure_patient" BEFORE INSERT ON "public"."notification_messages" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_patient_exists"();



CREATE OR REPLACE TRIGGER "trg_organization_manufacturer_settings" AFTER INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."create_manufacturer_settings"();



CREATE OR REPLACE TRIGGER "trg_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_treatment_ensure_patient" BEFORE INSERT ON "public"."treatment_records" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_patient_exists"();



CREATE OR REPLACE TRIGGER "trg_treatment_records_updated_at" BEFORE UPDATE ON "public"."treatment_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_virtual_code_history" AFTER UPDATE ON "public"."virtual_codes" FOR EACH ROW EXECUTE FUNCTION "public"."record_virtual_code_history"();

ALTER TABLE "public"."virtual_codes" DISABLE TRIGGER "trg_virtual_code_history";



CREATE OR REPLACE TRIGGER "trg_virtual_code_produced" AFTER INSERT ON "public"."virtual_codes" FOR EACH ROW EXECUTE FUNCTION "public"."record_production_history"();



CREATE OR REPLACE TRIGGER "trg_virtual_codes_updated_at" BEFORE UPDATE ON "public"."virtual_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."histories"
    ADD CONSTRAINT "histories_shipment_batch_id_fkey" FOREIGN KEY ("shipment_batch_id") REFERENCES "public"."shipment_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."histories"
    ADD CONSTRAINT "histories_virtual_code_id_fkey" FOREIGN KEY ("virtual_code_id") REFERENCES "public"."virtual_codes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inactive_product_usage_logs"
    ADD CONSTRAINT "inactive_product_usage_logs_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."inactive_product_usage_logs"
    ADD CONSTRAINT "inactive_product_usage_logs_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inactive_product_usage_logs"
    ADD CONSTRAINT "inactive_product_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inactive_product_usage_logs"
    ADD CONSTRAINT "inactive_product_usage_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."manufacturer_settings"
    ADD CONSTRAINT "manufacturer_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_messages"
    ADD CONSTRAINT "notification_messages_patient_phone_fkey" FOREIGN KEY ("patient_phone") REFERENCES "public"."patients"("phone_number") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_alerts"
    ADD CONSTRAINT "organization_alerts_recipient_org_id_fkey" FOREIGN KEY ("recipient_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shipment_batches"
    ADD CONSTRAINT "shipment_batches_from_organization_id_fkey" FOREIGN KEY ("from_organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shipment_batches"
    ADD CONSTRAINT "shipment_batches_to_organization_id_fkey" FOREIGN KEY ("to_organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shipment_details"
    ADD CONSTRAINT "shipment_details_shipment_batch_id_fkey" FOREIGN KEY ("shipment_batch_id") REFERENCES "public"."shipment_batches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_details"
    ADD CONSTRAINT "shipment_details_virtual_code_id_fkey" FOREIGN KEY ("virtual_code_id") REFERENCES "public"."virtual_codes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."treatment_details"
    ADD CONSTRAINT "treatment_details_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_details"
    ADD CONSTRAINT "treatment_details_virtual_code_id_fkey" FOREIGN KEY ("virtual_code_id") REFERENCES "public"."virtual_codes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."treatment_records"
    ADD CONSTRAINT "treatment_records_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."treatment_records"
    ADD CONSTRAINT "treatment_records_patient_phone_fkey" FOREIGN KEY ("patient_phone") REFERENCES "public"."patients"("phone_number") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."virtual_codes"
    ADD CONSTRAINT "virtual_codes_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_settings_service_only" ON "public"."app_settings" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."histories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "histories_insert" ON "public"."histories" FOR INSERT WITH CHECK (true);



CREATE POLICY "histories_select" ON "public"."histories" FOR SELECT USING (((("from_owner_id")::"text" = (("public"."get_user_organization_id"())::character varying)::"text") OR (("to_owner_id")::"text" = (("public"."get_user_organization_id"())::character varying)::"text") OR "public"."is_admin"()));



ALTER TABLE "public"."inactive_product_usage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inactive_usage_logs_admin_select" ON "public"."inactive_product_usage_logs" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "inactive_usage_logs_admin_update" ON "public"."inactive_product_usage_logs" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "inactive_usage_logs_insert" ON "public"."inactive_product_usage_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "inactive_usage_logs_manufacturer_select" ON "public"."inactive_product_usage_logs" FOR SELECT USING ((("manufacturer_org_id" = "public"."get_user_organization_id"()) AND ("public"."get_user_organization_type"() = 'MANUFACTURER'::"public"."organization_type")));



ALTER TABLE "public"."lots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lots_admin" ON "public"."lots" USING ("public"."is_admin"());



CREATE POLICY "lots_insert_manufacturer" ON "public"."lots" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "lots"."product_id") AND ("p"."organization_id" = "public"."get_user_organization_id"())))));



CREATE POLICY "lots_select" ON "public"."lots" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "lots"."product_id") AND ("p"."organization_id" = "public"."get_user_organization_id"())))) OR "public"."user_owns_codes_in_lot"("id") OR "public"."is_admin"()));



ALTER TABLE "public"."manufacturer_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "manufacturer_settings_insert" ON "public"."manufacturer_settings" FOR INSERT WITH CHECK ((("organization_id" = "public"."get_user_organization_id"()) OR "public"."is_admin"()));



CREATE POLICY "manufacturer_settings_own" ON "public"."manufacturer_settings" USING ((("organization_id" = "public"."get_user_organization_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."notification_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert" ON "public"."notification_messages" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "notifications_select" ON "public"."notification_messages" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."organization_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organization_alerts_insert" ON "public"."organization_alerts" FOR INSERT WITH CHECK (true);



CREATE POLICY "organization_alerts_select" ON "public"."organization_alerts" FOR SELECT USING ((("recipient_org_id" = "public"."get_user_organization_id"()) OR "public"."is_admin"()));



CREATE POLICY "organization_alerts_update" ON "public"."organization_alerts" FOR UPDATE USING (("recipient_org_id" = "public"."get_user_organization_id"())) WITH CHECK (("recipient_org_id" = "public"."get_user_organization_id"()));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_insert_register" ON "public"."organizations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "organizations_select_active" ON "public"."organizations" FOR SELECT USING ((("status" = 'ACTIVE'::"public"."organization_status") OR ("auth_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "organizations_update_admin" ON "public"."organizations" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "organizations_update_own" ON "public"."organizations" FOR UPDATE USING (("auth_user_id" = "auth"."uid"())) WITH CHECK (("auth_user_id" = "auth"."uid"()));



ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_insert" ON "public"."patients" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "patients_select" ON "public"."patients" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_admin" ON "public"."products" USING ("public"."is_admin"());



CREATE POLICY "products_insert_manufacturer" ON "public"."products" FOR INSERT WITH CHECK ((("organization_id" = "public"."get_user_organization_id"()) AND ("public"."get_user_organization_type"() = 'MANUFACTURER'::"public"."organization_type")));



CREATE POLICY "products_select" ON "public"."products" FOR SELECT USING ((("organization_id" = "public"."get_user_organization_id"()) OR "public"."has_inventory_for_product"("id", "public"."get_user_organization_id"()) OR "public"."is_admin"()));



COMMENT ON POLICY "products_select" ON "public"."products" IS '제품 조회 정책: 소유자(제조사), 재고 보유자, 관리자만 조회 가능 (재귀 방지)';



CREATE POLICY "products_update_own" ON "public"."products" FOR UPDATE USING ((("organization_id" = "public"."get_user_organization_id"()) AND ("public"."get_user_organization_type"() = 'MANUFACTURER'::"public"."organization_type")));



ALTER TABLE "public"."shipment_batches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shipment_batches_insert" ON "public"."shipment_batches" FOR INSERT WITH CHECK (("from_organization_id" = "public"."get_user_organization_id"()));



CREATE POLICY "shipment_batches_select" ON "public"."shipment_batches" FOR SELECT USING ((("from_organization_id" = "public"."get_user_organization_id"()) OR ("to_organization_id" = "public"."get_user_organization_id"()) OR "public"."is_admin"()));



CREATE POLICY "shipment_batches_update" ON "public"."shipment_batches" FOR UPDATE USING ((("from_organization_id" = "public"."get_user_organization_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."shipment_details" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shipment_details_insert" ON "public"."shipment_details" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."shipment_batches" "sb"
  WHERE (("sb"."id" = "shipment_details"."shipment_batch_id") AND ("sb"."from_organization_id" = "public"."get_user_organization_id"())))) OR "public"."is_admin"()));



CREATE POLICY "shipment_details_select" ON "public"."shipment_details" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."shipment_batches" "sb"
  WHERE (("sb"."id" = "shipment_details"."shipment_batch_id") AND (("sb"."from_organization_id" = "public"."get_user_organization_id"()) OR ("sb"."to_organization_id" = "public"."get_user_organization_id"()))))) OR "public"."is_admin"()));



ALTER TABLE "public"."treatment_details" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "treatment_details_insert" ON "public"."treatment_details" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."treatment_records" "tr"
  WHERE (("tr"."id" = "treatment_details"."treatment_id") AND ("tr"."hospital_id" = "public"."get_user_organization_id"())))) OR "public"."is_admin"()));



CREATE POLICY "treatment_details_select" ON "public"."treatment_details" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."treatment_records" "tr"
  WHERE (("tr"."id" = "treatment_details"."treatment_id") AND ("tr"."hospital_id" = "public"."get_user_organization_id"())))) OR "public"."is_admin"()));



ALTER TABLE "public"."treatment_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "treatment_records_admin" ON "public"."treatment_records" USING ("public"."is_admin"());



CREATE POLICY "treatment_records_hospital" ON "public"."treatment_records" USING ((("hospital_id" = "public"."get_user_organization_id"()) AND ("public"."get_user_organization_type"() = 'HOSPITAL'::"public"."organization_type")));



CREATE POLICY "verification_logs_service_only" ON "public"."virtual_code_verification_logs" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."virtual_code_verification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."virtual_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "virtual_codes_insert" ON "public"."virtual_codes" FOR INSERT WITH CHECK (true);



CREATE POLICY "virtual_codes_select" ON "public"."virtual_codes" FOR SELECT USING (((("owner_id")::"text" = (("public"."get_user_organization_id"())::character varying)::"text") OR "public"."user_is_lot_manufacturer"("lot_id") OR "public"."is_admin"()));



CREATE POLICY "virtual_codes_update_owner" ON "public"."virtual_codes" FOR UPDATE USING (((("owner_id")::"text" = (("public"."get_user_organization_id"())::character varying)::"text") OR "public"."is_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."add_quantity_to_lot"("p_lot_id" "uuid", "p_additional_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_quantity_to_lot"("p_lot_id" "uuid", "p_additional_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_quantity_to_lot"("p_lot_id" "uuid", "p_additional_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unique_patients"("p_hospital_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_unique_patients"("p_hospital_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unique_patients"("p_hospital_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_manufacturer_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_manufacturer_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_manufacturer_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_from_org_id" "uuid", "p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_from_org_id" "uuid", "p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment_atomic"("p_from_org_id" "uuid", "p_to_org_id" "uuid", "p_to_org_type" "public"."organization_type", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_hospital_id" "uuid", "p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_hospital_id" "uuid", "p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_treatment_atomic"("p_hospital_id" "uuid", "p_patient_phone" character varying, "p_treatment_date" "date", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_virtual_codes_for_lot"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_virtual_codes_for_lot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_virtual_codes_for_lot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."date_trunc_minute_immutable"("ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."date_trunc_minute_immutable"("ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_trunc_minute_immutable"("ts" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_patient_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_patient_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_patient_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_hmac_signature"("payload" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_hmac_signature"("payload" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_hmac_signature"("payload" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_lot_number"("p_manufacturer_id" "uuid", "p_model_name" character varying, "p_manufacture_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_lot_number"("p_manufacturer_id" "uuid", "p_model_name" character varying, "p_manufacture_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_lot_number"("p_manufacturer_id" "uuid", "p_model_name" character varying, "p_manufacture_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_virtual_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_virtual_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_virtual_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_virtual_code_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_virtual_code_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_virtual_code_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_event_summary"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_event_summary_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_event_summary_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_action_types" "text"[], "p_organization_id" "uuid", "p_lot_number" "text", "p_product_id" "uuid", "p_include_recalled" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_recalls"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_recalls_count"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_recalls_cursor"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_type" "text", "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_distributor"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_hospital"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats_manufacturer"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_history_summary"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_history_summary_count"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_history_summary_count"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_history_summary_count"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_history_summary_cursor"("p_organization_id" "uuid", "p_action_types" "text"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_is_recall" boolean, "p_limit" integer, "p_cursor_time" timestamp with time zone, "p_cursor_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_by_lot"("p_product_id" "uuid", "p_owner_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_by_lot"("p_product_id" "uuid", "p_owner_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_by_lot"("p_product_id" "uuid", "p_owner_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_by_lots_bulk"("p_owner_id" "uuid", "p_product_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_count"("p_product_id" "uuid", "p_owner_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_count"("p_product_id" "uuid", "p_owner_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_count"("p_product_id" "uuid", "p_owner_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_codes_paginated"("p_lot_id" "uuid", "p_page" integer, "p_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_codes_paginated"("p_lot_id" "uuid", "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_codes_paginated"("p_lot_id" "uuid", "p_page" integer, "p_page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notification_stats"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_patient"("p_phone_number" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_patient"("p_phone_number" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_patient"("p_phone_number" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_code_counts"("p_org_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_code_counts"("p_org_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_code_counts"("p_org_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_names"("p_org_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_names"("p_org_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_names"("p_org_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_status_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_status_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_status_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_received_shipment_history"("p_org_id" "uuid", "p_page" integer, "p_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_received_shipment_history"("p_org_id" "uuid", "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_received_shipment_history"("p_org_id" "uuid", "p_page" integer, "p_page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shipment_batch_summaries"("p_batch_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_shipment_batch_summaries"("p_batch_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shipment_batch_summaries"("p_batch_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_treatment_summaries"("p_treatment_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_treatment_summaries"("p_treatment_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_treatment_summaries"("p_treatment_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organization_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organization_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organization_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_virtual_code_secret"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_virtual_code_secret"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_virtual_code_secret"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_inventory_for_product"("p_product_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_inactive_product_usage"("p_usage_type" character varying, "p_usage_id" "uuid", "p_product_id" "uuid", "p_organization_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_inactive_product_usage"("p_usage_type" character varying, "p_usage_id" "uuid", "p_product_id" "uuid", "p_organization_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_inactive_product_usage"("p_usage_type" character varying, "p_usage_id" "uuid", "p_product_id" "uuid", "p_organization_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_phone_number"("phone" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_phone_number"("phone" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_phone_number"("phone" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_shipment_batch_id" "uuid", "p_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_shipment_batch_id" "uuid", "p_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_shipment_batch_id" "uuid", "p_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_from_org_id" "uuid", "p_shipment_batch_id" "uuid", "p_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_from_org_id" "uuid", "p_shipment_batch_id" "uuid", "p_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_shipment_atomic"("p_from_org_id" "uuid", "p_shipment_batch_id" "uuid", "p_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_treatment_id" "uuid", "p_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_treatment_id" "uuid", "p_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_treatment_id" "uuid", "p_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_hospital_id" "uuid", "p_treatment_id" "uuid", "p_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_hospital_id" "uuid", "p_treatment_id" "uuid", "p_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_treatment_atomic"("p_hospital_id" "uuid", "p_treatment_id" "uuid", "p_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_production_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_production_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_production_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_virtual_code_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_virtual_code_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_virtual_code_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."select_fifo_codes"("p_product_id" "uuid", "p_owner_id" character varying, "p_quantity" integer, "p_lot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."select_fifo_codes"("p_product_id" "uuid", "p_owner_id" character varying, "p_quantity" integer, "p_lot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."select_fifo_codes"("p_product_id" "uuid", "p_owner_id" character varying, "p_quantity" integer, "p_lot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_lot"("p_product_id" "uuid", "p_lot_number" character varying, "p_quantity" integer, "p_manufacture_date" "date", "p_expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_lot"("p_product_id" "uuid", "p_lot_number" character varying, "p_quantity" integer, "p_manufacture_date" "date", "p_expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_lot"("p_product_id" "uuid", "p_lot_number" character varying, "p_quantity" integer, "p_manufacture_date" "date", "p_expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_lot_manufacturer"("lot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_lot_manufacturer"("lot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_lot_manufacturer"("lot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_codes_in_lot"("lot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_codes_in_lot"("lot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_codes_in_lot"("lot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_business_number"("bn" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_business_number"("bn" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_business_number"("bn" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_virtual_code"("code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."verify_virtual_code"("code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_virtual_code"("code" character varying) TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."histories" TO "anon";
GRANT ALL ON TABLE "public"."histories" TO "authenticated";
GRANT ALL ON TABLE "public"."histories" TO "service_role";



GRANT ALL ON TABLE "public"."inactive_product_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."inactive_product_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."inactive_product_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."lots" TO "anon";
GRANT ALL ON TABLE "public"."lots" TO "authenticated";
GRANT ALL ON TABLE "public"."lots" TO "service_role";



GRANT ALL ON TABLE "public"."manufacturer_settings" TO "anon";
GRANT ALL ON TABLE "public"."manufacturer_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."manufacturer_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notification_messages" TO "anon";
GRANT ALL ON TABLE "public"."notification_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_messages" TO "service_role";



GRANT ALL ON TABLE "public"."organization_alerts" TO "anon";
GRANT ALL ON TABLE "public"."organization_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_batches" TO "anon";
GRANT ALL ON TABLE "public"."shipment_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_batches" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_details" TO "anon";
GRANT ALL ON TABLE "public"."shipment_details" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_details" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_details" TO "anon";
GRANT ALL ON TABLE "public"."treatment_details" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_details" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_records" TO "anon";
GRANT ALL ON TABLE "public"."treatment_records" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_records" TO "service_role";



GRANT ALL ON TABLE "public"."virtual_code_verification_logs" TO "anon";
GRANT ALL ON TABLE "public"."virtual_code_verification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."virtual_code_verification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."virtual_codes" TO "anon";
GRANT ALL ON TABLE "public"."virtual_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."virtual_codes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE POLICY "Admins can access all files" ON "storage"."objects" USING ((("bucket_id" = 'business-licenses'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."organizations"
  WHERE (("organizations"."auth_user_id" = "auth"."uid"()) AND ("organizations"."type" = 'ADMIN'::"public"."organization_type"))))));



CREATE POLICY "Users can delete their own files" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'business-licenses'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Users can update their own files" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'business-licenses'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Users can upload their own files" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'business-licenses'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Users can view their own files" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'business-licenses'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



