import type {
  Product,
  ProductForTreatment,
  HospitalKnownProduct,
  InventorySummary,
  InventoryByLot,
  ProductInventoryDetail,
} from '@/types/api.types';

export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: `prod-${Math.random().toString(36).substr(2, 9)}`,
  manufacturer_org_id: 'org-manufacturer-1',
  name: 'PDO Thread Standard',
  model_name: 'PDO-STD-100',
  udi_di: '1234567890123',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deactivation_reason: null,
  deactivated_at: null,
  deactivation_note: null,
  ...overrides,
});

export const mockProducts: Product[] = [
  createMockProduct({
    id: 'prod-1',
    name: 'PDO Thread Type A',
    model_name: 'PDO-A-100',
    udi_di: '1234567890001',
  }),
  createMockProduct({
    id: 'prod-2',
    name: 'PDO Thread Type B',
    model_name: 'PDO-B-200',
    udi_di: '1234567890002',
  }),
  createMockProduct({
    id: 'prod-3',
    name: 'PDO Thread Type C',
    model_name: 'PDO-C-300',
    udi_di: '1234567890003',
    is_active: false,
    deactivation_reason: 'DISCONTINUED',
    deactivated_at: '2024-01-15T00:00:00Z',
  }),
  createMockProduct({
    id: 'prod-4',
    name: 'PDO Thread Premium',
    model_name: 'PDO-P-500',
    udi_di: '1234567890004',
  }),
];

export const mockProductsForTreatment: ProductForTreatment[] = [
  {
    productId: 'prod-1',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    udiDi: '1234567890001',
    alias: 'A타입',
    availableQuantity: 50,
  },
  {
    productId: 'prod-2',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    udiDi: '1234567890002',
    alias: null,
    availableQuantity: 30,
  },
  {
    productId: 'prod-4',
    productName: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    udiDi: '1234567890004',
    alias: '프리미엄',
    availableQuantity: 20,
  },
];

export const mockHospitalKnownProducts: HospitalKnownProduct[] = [
  {
    id: 'hkp-1',
    productId: 'prod-1',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    udiDi: '1234567890001',
    alias: 'A타입',
    isActive: true,
    firstReceivedAt: '2024-01-01T00:00:00Z',
    currentInventory: 50,
  },
  {
    id: 'hkp-2',
    productId: 'prod-2',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    udiDi: '1234567890002',
    alias: null,
    isActive: true,
    firstReceivedAt: '2024-01-10T00:00:00Z',
    currentInventory: 30,
  },
  {
    id: 'hkp-3',
    productId: 'prod-4',
    productName: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    udiDi: '1234567890004',
    alias: '프리미엄',
    isActive: false,
    firstReceivedAt: '2024-02-01T00:00:00Z',
    currentInventory: 0,
  },
];

export const mockInventorySummaries: InventorySummary[] = [
  {
    productId: 'prod-1',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    udiDi: '1234567890001',
    totalQuantity: 150,
  },
  {
    productId: 'prod-2',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    udiDi: '1234567890002',
    totalQuantity: 80,
  },
  {
    productId: 'prod-4',
    productName: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    udiDi: '1234567890004',
    totalQuantity: 45,
  },
];

export const mockInventoryByLot: InventoryByLot[] = [
  {
    lotId: 'lot-1',
    lotNumber: 'LOT-2024-001',
    manufactureDate: '2024-01-01',
    expiryDate: '2026-01-01',
    quantity: 100,
  },
  {
    lotId: 'lot-2',
    lotNumber: 'LOT-2024-002',
    manufactureDate: '2024-02-01',
    expiryDate: '2026-02-01',
    quantity: 50,
  },
  {
    lotId: 'lot-3',
    lotNumber: 'LOT-2024-003',
    manufactureDate: '2024-03-01',
    expiryDate: '2024-03-15', // 만료 임박
    quantity: 20,
  },
];

export const mockProductInventoryDetail: ProductInventoryDetail = {
  product: mockProducts[0],
  totalQuantity: 150,
  byLot: mockInventoryByLot,
};
