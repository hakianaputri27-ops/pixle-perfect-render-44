export type RoomStatus = "Terisi" | "Kosong" | "Maintenance";
export type PaymentStatus = "Lunas" | "Sebagian" | "Belum Bayar";
export type MaintenanceStatus = "Open" | "In Progress" | "Completed";

export interface Property {
  id: string;
  name: string;
  address?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  rent: number;
  status: RoomStatus;
  tenantId?: string;
  notes?: string;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  phone?: string;
  roomId?: string;
  rent: number;
  moveInDate?: string;
  dueDate?: string;
  deposit?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  propertyId: string;
  tenantId?: string;
  roomId?: string;
  amount: number;
  date: string;
  month: string; // YYYY-MM
  status: PaymentStatus;
  notes?: string;
}

export const EXPENSE_CATEGORIES = [
  "Listrik",
  "Air",
  "Internet",
  "Kebersihan",
  "Keamanan",
  "Perbaikan",
  "Pajak",
  "Gaji",
  "Perlengkapan",
  "Lainnya",
] as const;

export interface Expense {
  id: string;
  propertyId: string;
  date: string;
  category: string;
  amount: number;
  notes?: string;
}

export interface Asset {
  id: string;
  propertyId: string;
  name: string;
  category?: string;
  price: number;
  purchaseDate: string;
  usefulLife: number; // years
  notes?: string;
}

export interface Maintenance {
  id: string;
  propertyId: string;
  roomId?: string;
  problem: string;
  date: string;
  estimatedCost?: number;
  actualCost?: number;
  status: MaintenanceStatus;
  notes?: string;
}

export interface Settings {
  currency: string;
  theme: "light" | "dark";
  activePropertyId?: string;
}

export interface DB {
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  expenses: Expense[];
  assets: Asset[];
  maintenance: Maintenance[];
  settings: Settings;
}

export const emptyDB: DB = {
  properties: [],
  rooms: [],
  tenants: [],
  payments: [],
  expenses: [],
  assets: [],
  maintenance: [],
  settings: { currency: "IDR", theme: "light" },
};
