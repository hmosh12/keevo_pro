export type UserRole = 'admin' | 'accountant' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxNumber?: string;
  currency: string;
  address?: string;
  fiscalYearStart?: string;
  ownerId: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'journal';
  amount: number;
  accountId: string;
  reference?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierId: string;
}
