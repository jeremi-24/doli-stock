export type Product = {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  category: string;
};

export type InvoiceItem = {
  product: Product;
  quantity: number;
};

export type Invoice = {
  id: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  type: 'pos' | 'manual';
};

export type ActiveModules = {
  stock: boolean;
  invoicing: boolean;
  barcode: boolean;
  pos: boolean;
};

export type ShopInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

export type ThemeColors = {
    // HSL values as string, e.g. "231 48% 48%"
    primary: string;
    background: string;
    accent: string;
};
