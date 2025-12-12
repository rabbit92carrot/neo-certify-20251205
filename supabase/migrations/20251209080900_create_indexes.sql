-- Migration: 20251209080900_create_indexes
-- Description: Create performance indexes for all tables
-- Created: 2025-12-09

-- ============================================
-- Organizations Indexes
-- ============================================
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_business_number ON organizations(business_number);
CREATE INDEX idx_organizations_auth_user ON organizations(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ============================================
-- Manufacturer Settings Indexes
-- ============================================
-- Primary lookup is by organization_id (already has UNIQUE constraint)

-- ============================================
-- Products Indexes
-- ============================================
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_active ON products(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_udi_di ON products(udi_di);

-- ============================================
-- Lots Indexes
-- ============================================
CREATE INDEX idx_lots_product ON lots(product_id);
CREATE INDEX idx_lots_manufacture_date ON lots(manufacture_date);
CREATE INDEX idx_lots_expiry_date ON lots(expiry_date);

-- FIFO ordering: Older manufacture dates first, then by creation order
CREATE INDEX idx_lots_fifo ON lots(product_id, manufacture_date ASC, created_at ASC);

-- ============================================
-- Virtual Codes Indexes
-- ============================================
CREATE INDEX idx_virtual_codes_lot ON virtual_codes(lot_id);
CREATE INDEX idx_virtual_codes_status ON virtual_codes(status);
CREATE INDEX idx_virtual_codes_owner ON virtual_codes(owner_type, owner_id);
CREATE INDEX idx_virtual_codes_code ON virtual_codes(code);

-- FIFO stock lookup: Find IN_STOCK codes ordered by lot manufacture date
CREATE INDEX idx_virtual_codes_stock_fifo ON virtual_codes(lot_id, status, created_at)
  WHERE status = 'IN_STOCK';

-- Inventory count by owner
CREATE INDEX idx_virtual_codes_inventory ON virtual_codes(owner_id, status)
  WHERE status = 'IN_STOCK';

-- ============================================
-- Shipment Batches Indexes
-- ============================================
CREATE INDEX idx_shipment_batches_from_org ON shipment_batches(from_organization_id);
CREATE INDEX idx_shipment_batches_to_org ON shipment_batches(to_organization_id);
CREATE INDEX idx_shipment_batches_date ON shipment_batches(shipment_date DESC);
CREATE INDEX idx_shipment_batches_recalled ON shipment_batches(is_recalled);

-- Recall eligibility check: Not yet recalled, within 24 hours
CREATE INDEX idx_shipment_batches_recallable ON shipment_batches(from_organization_id, shipment_date)
  WHERE is_recalled = FALSE;

-- ============================================
-- Shipment Details Indexes
-- ============================================
CREATE INDEX idx_shipment_details_batch ON shipment_details(shipment_batch_id);
CREATE INDEX idx_shipment_details_code ON shipment_details(virtual_code_id);

-- ============================================
-- Treatment Records Indexes
-- ============================================
CREATE INDEX idx_treatment_records_hospital ON treatment_records(hospital_id);
CREATE INDEX idx_treatment_records_patient ON treatment_records(patient_phone);
CREATE INDEX idx_treatment_records_date ON treatment_records(treatment_date DESC);

-- Hospital + date for common queries
CREATE INDEX idx_treatment_records_hospital_date ON treatment_records(hospital_id, treatment_date DESC);

-- ============================================
-- Treatment Details Indexes
-- ============================================
CREATE INDEX idx_treatment_details_treatment ON treatment_details(treatment_id);
CREATE INDEX idx_treatment_details_code ON treatment_details(virtual_code_id);

-- ============================================
-- Histories Indexes
-- ============================================
CREATE INDEX idx_histories_virtual_code ON histories(virtual_code_id);
CREATE INDEX idx_histories_action ON histories(action_type);
CREATE INDEX idx_histories_created ON histories(created_at DESC);
CREATE INDEX idx_histories_shipment ON histories(shipment_batch_id) WHERE shipment_batch_id IS NOT NULL;
CREATE INDEX idx_histories_recall ON histories(is_recall) WHERE is_recall = TRUE;

-- Owner-based history lookup
CREATE INDEX idx_histories_from_owner ON histories(from_owner_type, from_owner_id);
CREATE INDEX idx_histories_to_owner ON histories(to_owner_type, to_owner_id);

-- ============================================
-- Notification Messages Indexes
-- ============================================
CREATE INDEX idx_notifications_patient ON notification_messages(patient_phone);
CREATE INDEX idx_notifications_type ON notification_messages(type);
CREATE INDEX idx_notifications_created ON notification_messages(created_at DESC);

-- Unsent messages (for future API integration)
CREATE INDEX idx_notifications_unsent ON notification_messages(created_at)
  WHERE is_sent = FALSE;
