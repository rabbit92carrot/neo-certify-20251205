-- Migration: 20251209081100_create_triggers
-- Description: Create triggers for automatic operations
-- Created: 2025-12-09

-- ============================================
-- Updated At Triggers
-- ============================================
-- Automatically update the updated_at column when a row is modified

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_manufacturer_settings_updated_at
  BEFORE UPDATE ON manufacturer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_virtual_codes_updated_at
  BEFORE UPDATE ON virtual_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Virtual Code Auto-Generation Trigger
-- ============================================
-- When a new lot is created, automatically generate virtual codes

CREATE OR REPLACE FUNCTION create_virtual_codes_for_lot()
RETURNS TRIGGER AS $$
DECLARE
  v_manufacturer_id UUID;
  i INT;
BEGIN
  -- Get the manufacturer ID from the product
  SELECT p.organization_id INTO v_manufacturer_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- Generate virtual codes for the entire quantity
  FOR i IN 1..NEW.quantity LOOP
    INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
    VALUES (
      generate_virtual_code(),
      NEW.id,
      'IN_STOCK',
      'ORGANIZATION',
      v_manufacturer_id::VARCHAR
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lot_create_virtual_codes
  AFTER INSERT ON lots
  FOR EACH ROW
  EXECUTE FUNCTION create_virtual_codes_for_lot();

-- ============================================
-- History Recording Trigger for Virtual Codes
-- ============================================
-- Record history when virtual code ownership changes

CREATE OR REPLACE FUNCTION record_virtual_code_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_virtual_code_history
  AFTER UPDATE ON virtual_codes
  FOR EACH ROW
  EXECUTE FUNCTION record_virtual_code_history();

-- ============================================
-- Production History Trigger
-- ============================================
-- Record PRODUCED history when virtual codes are created

CREATE OR REPLACE FUNCTION record_production_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_virtual_code_produced
  AFTER INSERT ON virtual_codes
  FOR EACH ROW
  EXECUTE FUNCTION record_production_history();

-- ============================================
-- Manufacturer Settings Auto-Creation
-- ============================================
-- When a manufacturer organization is created, create default settings

CREATE OR REPLACE FUNCTION create_manufacturer_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'MANUFACTURER' THEN
    INSERT INTO manufacturer_settings (organization_id)
    VALUES (NEW.id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organization_manufacturer_settings
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_manufacturer_settings();

-- ============================================
-- Patient Auto-Creation Trigger
-- ============================================
-- When a treatment is created with a new patient phone, create patient record

CREATE OR REPLACE FUNCTION ensure_patient_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO patients (phone_number)
  VALUES (NEW.patient_phone)
  ON CONFLICT (phone_number) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_treatment_ensure_patient
  BEFORE INSERT ON treatment_records
  FOR EACH ROW
  EXECUTE FUNCTION ensure_patient_exists();

-- Same for notification messages
CREATE TRIGGER trg_notification_ensure_patient
  BEFORE INSERT ON notification_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_patient_exists();

