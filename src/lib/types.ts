export type RoomStatus = "Terisi" | "Kosong" | "Maintenance";
export type PaymentStatus = "Lunas" | "Sebagian" | "Belum Bayar";
export type MaintenanceStatus = "Open" | "In Progress" | "Completed";

export interface Property {
  id: string;
  name: string;
  address?: string | undefined;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  rent: number;
  status: RoomStatus;
  tenantId?: string | undefined;
  notes?: string | undefined;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  phone?: string | undefined;
  roomId?: string | undefined;
  rent: number;
  moveInDate?: string | undefined;
  dueDate?: string | undefined;
  deposit?: number | undefined;
  notes?: string | undefined;
}

export interface Payment {
  id: string;
  propertyId: string;
  tenantId?: string | undefined;
  roomId?: string | undefined;
  amount: number;
  date: string;
  month: string; // YYYY-MM
  status: PaymentStatus;
  notes?: string | undefined;
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
  notes?: string | undefined;
}

export interface Asset {
  id: string;
  propertyId: string;
  name: string;
  category?: string | undefined;
  price: number;
  purchaseDate: string;
  usefulLife: number; // years
  notes?: string | undefined;
}

export interface Maintenance {
  id: string;
  propertyId: string;
  roomId?: string | undefined;
  problem: string;
  date: string;
  estimatedCost?: number | undefined;
  actualCost?: number | undefined;
  status: MaintenanceStatus;
  notes?: string | undefined;
}

export interface Settings {
  currency: string;
  theme: "light" | "dark";
  activePropertyId?: string | undefined;
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
