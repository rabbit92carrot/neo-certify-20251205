-- Migration: 20251209081200_enable_rls
-- Description: Enable Row Level Security and create policies
-- Created: 2025-12-09

-- ============================================
-- Enable RLS on All Tables
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Helper Functions
-- ============================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT id FROM organizations WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's organization type
CREATE OR REPLACE FUNCTION get_user_organization_type()
RETURNS organization_type AS $$
  SELECT type FROM organizations WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organizations
    WHERE auth_user_id = auth.uid() AND type = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Organizations Policies
-- ============================================

-- SELECT: View active organizations (for partner selection) or own organization
CREATE POLICY "organizations_select_active"
  ON organizations FOR SELECT
  USING (
    status = 'ACTIVE'
    OR auth_user_id = auth.uid()
    OR is_admin()
  );

-- INSERT: Anyone authenticated can register (will be pending approval)
CREATE POLICY "organizations_insert_register"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Own organization only
CREATE POLICY "organizations_update_own"
  ON organizations FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- UPDATE: Admin can update any organization (approval, status change)
CREATE POLICY "organizations_update_admin"
  ON organizations FOR UPDATE
  USING (is_admin());

-- ============================================
-- Manufacturer Settings Policies
-- ============================================

-- SELECT/UPDATE: Own settings or admin
CREATE POLICY "manufacturer_settings_own"
  ON manufacturer_settings FOR ALL
  USING (
    organization_id = get_user_organization_id()
    OR is_admin()
  );

-- INSERT: Handled by trigger, but allow for organization creation
CREATE POLICY "manufacturer_settings_insert"
  ON manufacturer_settings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    OR is_admin()
  );

-- ============================================
-- Products Policies
-- ============================================

-- SELECT: View active products or own products
CREATE POLICY "products_select"
  ON products FOR SELECT
  USING (
    is_active = TRUE
    OR organization_id = get_user_organization_id()
    OR is_admin()
  );

-- INSERT: Manufacturers can create products
CREATE POLICY "products_insert_manufacturer"
  ON products FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_organization_type() = 'MANUFACTURER'
  );

-- UPDATE: Own products only (manufacturer)
CREATE POLICY "products_update_own"
  ON products FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_organization_type() = 'MANUFACTURER'
  );

-- Admin full access
CREATE POLICY "products_admin"
  ON products FOR ALL
  USING (is_admin());

-- ============================================
-- Lots Policies
-- ============================================

-- SELECT: Product owner or code holder
CREATE POLICY "lots_select"
  ON lots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = lots.product_id
      AND p.organization_id = get_user_organization_id()
    )
    OR EXISTS (
      SELECT 1 FROM virtual_codes vc
      WHERE vc.lot_id = lots.id
      AND vc.owner_id = get_user_organization_id()::VARCHAR
    )
    OR is_admin()
  );

-- INSERT: Manufacturer only
CREATE POLICY "lots_insert_manufacturer"
  ON lots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Admin full access
CREATE POLICY "lots_admin"
  ON lots FOR ALL
  USING (is_admin());

-- ============================================
-- Patients Policies
-- ============================================

-- SELECT: Any authenticated user (for treatment/notification)
CREATE POLICY "patients_select"
  ON patients FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Handled by trigger
CREATE POLICY "patients_insert"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Virtual Codes Policies
-- ============================================

-- SELECT: Owner or product manufacturer
CREATE POLICY "virtual_codes_select"
  ON virtual_codes FOR SELECT
  USING (
    owner_id = get_user_organization_id()::VARCHAR
    OR EXISTS (
      SELECT 1 FROM lots l
      JOIN products p ON l.product_id = p.id
      WHERE l.id = virtual_codes.lot_id
      AND p.organization_id = get_user_organization_id()
    )
    OR is_admin()
  );

-- UPDATE: Owner only (for shipment, treatment)
CREATE POLICY "virtual_codes_update_owner"
  ON virtual_codes FOR UPDATE
  USING (
    owner_id = get_user_organization_id()::VARCHAR
    OR is_admin()
  );

-- INSERT: Handled by trigger (lot creation)
CREATE POLICY "virtual_codes_insert"
  ON virtual_codes FOR INSERT
  WITH CHECK (TRUE);  -- Controlled by trigger

-- ============================================
-- Shipment Batches Policies
-- ============================================

-- SELECT: Sender or receiver
CREATE POLICY "shipment_batches_select"
  ON shipment_batches FOR SELECT
  USING (
    from_organization_id = get_user_organization_id()
    OR to_organization_id = get_user_organization_id()
    OR is_admin()
  );

-- INSERT: Sender only
CREATE POLICY "shipment_batches_insert"
  ON shipment_batches FOR INSERT
  WITH CHECK (
    from_organization_id = get_user_organization_id()
  );

-- UPDATE: Sender only (for recall)
CREATE POLICY "shipment_batches_update"
  ON shipment_batches FOR UPDATE
  USING (
    from_organization_id = get_user_organization_id()
    OR is_admin()
  );

-- ============================================
-- Shipment Details Policies
-- ============================================

-- SELECT: Related to accessible shipment batch
CREATE POLICY "shipment_details_select"
  ON shipment_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipment_batches sb
      WHERE sb.id = shipment_details.shipment_batch_id
      AND (
        sb.from_organization_id = get_user_organization_id()
        OR sb.to_organization_id = get_user_organization_id()
      )
    )
    OR is_admin()
  );

-- INSERT: Controlled by shipment creation logic
CREATE POLICY "shipment_details_insert"
  ON shipment_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipment_batches sb
      WHERE sb.id = shipment_batch_id
      AND sb.from_organization_id = get_user_organization_id()
    )
    OR is_admin()
  );

-- ============================================
-- Treatment Records Policies
-- ============================================

-- SELECT/INSERT/UPDATE: Hospital only
CREATE POLICY "treatment_records_hospital"
  ON treatment_records FOR ALL
  USING (
    hospital_id = get_user_organization_id()
    AND get_user_organization_type() = 'HOSPITAL'
  );

-- Admin full access
CREATE POLICY "treatment_records_admin"
  ON treatment_records FOR ALL
  USING (is_admin());

-- ============================================
-- Treatment Details Policies
-- ============================================

-- SELECT: Related to accessible treatment record
CREATE POLICY "treatment_details_select"
  ON treatment_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM treatment_records tr
      WHERE tr.id = treatment_details.treatment_id
      AND tr.hospital_id = get_user_organization_id()
    )
    OR is_admin()
  );

-- INSERT: Hospital only
CREATE POLICY "treatment_details_insert"
  ON treatment_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM treatment_records tr
      WHERE tr.id = treatment_id
      AND tr.hospital_id = get_user_organization_id()
    )
    OR is_admin()
  );

-- ============================================
-- Histories Policies
-- ============================================

-- SELECT: Related owner or admin
CREATE POLICY "histories_select"
  ON histories FOR SELECT
  USING (
    from_owner_id = get_user_organization_id()::VARCHAR
    OR to_owner_id = get_user_organization_id()::VARCHAR
    OR is_admin()
  );

-- INSERT: System only (via triggers/functions)
CREATE POLICY "histories_insert"
  ON histories FOR INSERT
  WITH CHECK (TRUE);  -- Controlled by triggers

-- ============================================
-- Notification Messages Policies
-- ============================================

-- SELECT: Any authenticated user (for Mock page)
CREATE POLICY "notifications_select"
  ON notification_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: System/Hospital (for treatment completion)
CREATE POLICY "notifications_insert"
  ON notification_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
