-- Migration: 20251210033000_fix_rls_recursion
-- Description: Fix infinite recursion in RLS policies for lots and virtual_codes
-- Created: 2025-12-10

-- ============================================
-- Drop Problematic Policies
-- ============================================

DROP POLICY IF EXISTS "lots_select" ON lots;
DROP POLICY IF EXISTS "virtual_codes_select" ON virtual_codes;

-- ============================================
-- Helper Function: Check if user owns virtual codes in a lot
-- Uses SECURITY DEFINER to bypass RLS and prevent recursion
-- ============================================

CREATE OR REPLACE FUNCTION user_owns_codes_in_lot(lot_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM virtual_codes
    WHERE lot_id = lot_uuid
    AND owner_id = get_user_organization_id()::VARCHAR
    AND owner_type = 'ORGANIZATION'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Helper Function: Check if user is product manufacturer for a lot
-- Uses SECURITY DEFINER to bypass RLS and prevent recursion
-- ============================================

CREATE OR REPLACE FUNCTION user_is_lot_manufacturer(lot_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM lots l
    JOIN products p ON l.product_id = p.id
    WHERE l.id = lot_uuid
    AND p.organization_id = get_user_organization_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Fixed Lots Policy
-- ============================================

-- SELECT: Product owner or code holder (using helper function)
CREATE POLICY "lots_select"
  ON lots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = lots.product_id
      AND p.organization_id = get_user_organization_id()
    )
    OR user_owns_codes_in_lot(lots.id)
    OR is_admin()
  );

-- ============================================
-- Fixed Virtual Codes Policy
-- ============================================

-- SELECT: Owner or product manufacturer (using helper function)
CREATE POLICY "virtual_codes_select"
  ON virtual_codes FOR SELECT
  USING (
    owner_id = get_user_organization_id()::VARCHAR
    OR user_is_lot_manufacturer(virtual_codes.lot_id)
    OR is_admin()
  );
