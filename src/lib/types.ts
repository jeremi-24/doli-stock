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
  total: number;
  createdAt: Date;
};

export type ActiveModules = {
  stock: boolean;
  invoicing: boolean;
  barcode: boolean;
  pos: boolean;
};
