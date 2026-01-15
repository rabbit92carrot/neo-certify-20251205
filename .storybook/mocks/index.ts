// Products
export {
  createMockProduct,
  mockProducts,
  mockProductsForTreatment,
  mockHospitalKnownProducts,
  mockInventorySummaries,
  mockInventoryByLot,
  mockProductInventoryDetail,
} from './products';

// Organizations
export {
  createMockOrganization,
  mockManufacturer,
  mockDistributor,
  mockHospital,
  mockAdmin,
  mockOrganizations,
  mockPendingOrganizations,
  mockOrganizationSelectItems,
  getOrganizationsByType,
} from './organizations';

// Mock search function for SearchableCombobox
export const mockSearchOrganizations = async (
  query: string
): Promise<{ value: string; label: string; description?: string }[]> => {
  const { mockOrganizationSelectItems } = await import('./organizations');
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockOrganizationSelectItems
    .filter((org) => org.name.toLowerCase().includes(query.toLowerCase()))
    .map((org) => ({
      value: org.id,
      label: org.name,
      description: org.type === 'DISTRIBUTOR' ? '유통사' : '병원',
    }));
};

// Mock cart items
export interface MockCartItem {
  productId: string;
  productName: string;
  modelName?: string;
  quantity: number;
  maxQuantity?: number;
  lotId?: string;
  lotNumber?: string;
}

export const mockCartItems: MockCartItem[] = [
  {
    productId: 'prod-1',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    quantity: 10,
    maxQuantity: 50,
    lotId: 'lot-1',
    lotNumber: 'LOT-2024-001',
  },
  {
    productId: 'prod-2',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    quantity: 5,
    maxQuantity: 30,
    lotId: 'lot-2',
    lotNumber: 'LOT-2024-002',
  },
];

// Mock shipment history
export interface MockShipmentSummary {
  batchId: string;
  createdAt: string;
  toOrganizationName: string;
  fromOrganizationName: string;
  totalQuantity: number;
  productSummary: string;
  canRecall: boolean;
}

export const mockShipmentHistory: MockShipmentSummary[] = [
  {
    batchId: 'batch-1',
    createdAt: new Date().toISOString(),
    toOrganizationName: '메디컬 유통',
    fromOrganizationName: '(주)잼버코리아',
    totalQuantity: 50,
    productSummary: 'PDO Thread Type A x 30, PDO Thread Type B x 20',
    canRecall: true,
  },
  {
    batchId: 'batch-2',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    toOrganizationName: '서울미래의원',
    fromOrganizationName: '메디컬 유통',
    totalQuantity: 20,
    productSummary: 'PDO Thread Type A x 20',
    canRecall: false,
  },
];

// Mock treatment history
export interface MockTreatmentSummary {
  treatmentId: string;
  treatmentDate: string;
  patientPhone: string;
  totalQuantity: number;
  productSummary: string;
  canRecall: boolean;
}

export const mockTreatmentHistory: MockTreatmentSummary[] = [
  {
    treatmentId: 'treatment-1',
    treatmentDate: new Date().toISOString(),
    patientPhone: '010-****-1234',
    totalQuantity: 5,
    productSummary: 'PDO Thread Type A x 3, PDO Thread Type B x 2',
    canRecall: true,
  },
  {
    treatmentId: 'treatment-2',
    treatmentDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    patientPhone: '010-****-5678',
    totalQuantity: 3,
    productSummary: 'PDO Thread Premium x 3',
    canRecall: false,
  },
];
