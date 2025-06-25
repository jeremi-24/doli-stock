"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, ActiveModules, InvoiceItem, Invoice, ShopInfo, ThemeColors } from '@/lib/types';
import { sampleProducts } from '@/lib/data';

interface AppContextType {
  products: Product[];
  invoices: Invoice[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addMultipleProducts: (products: Product[]) => void;
  processSale: (cartItems: InvoiceItem[]) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  activeModules: ActiveModules;
  setActiveModules: React.Dispatch<React.SetStateAction<ActiveModules>>;
  shopInfo: ShopInfo;
  setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
  themeColors: ThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialModules: ActiveModules = {
  stock: true,
  invoicing: true,
  barcode: true,
  pos: true,
};

const initialShopInfo: ShopInfo = {
  name: 'StockHero Inc.',
  address: '123 Main St, Anytown, USA',
  phone: '555-123-4567',
  email: 'contact@stockhero.dev',
};

const initialThemeColors: ThemeColors = {
  primary: '231 48% 48%',
  background: '220 13% 96%',
  accent: '262 52% 50%',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);
  const [shopInfo, setShopInfo] = useState<ShopInfo>(initialShopInfo);
  const [themeColors, setThemeColors] = useState<ThemeColors>(initialThemeColors);

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('stockhero_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(sampleProducts);
      }
      
      const storedInvoices = localStorage.getItem('stockhero_invoices');
      if (storedInvoices) {
        const parsedInvoices = JSON.parse(storedInvoices).map((inv: Invoice) => ({
            ...inv,
            createdAt: new Date(inv.createdAt)
        }));
        setInvoices(parsedInvoices);
      }

      const storedModules = localStorage.getItem('stockhero_modules');
      if (storedModules) {
        setActiveModules(JSON.parse(storedModules));
      }

      const storedShopInfo = localStorage.getItem('stockhero_shopinfo');
      if (storedShopInfo) {
        setShopInfo(JSON.parse(storedShopInfo));
      }

      const storedThemeColors = localStorage.getItem('stockhero_themecolors');
      if (storedThemeColors) {
        setThemeColors(JSON.parse(storedThemeColors));
      }

    } catch (error) {
      console.error("Failed to access localStorage", error);
      setProducts(sampleProducts);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_products', JSON.stringify(products));
    }
  }, [products, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_invoices', JSON.stringify(invoices));
    }
  }, [invoices, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_modules', JSON.stringify(activeModules));
    }
  }, [activeModules, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_shopinfo', JSON.stringify(shopInfo));
    }
  }, [shopInfo, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_themecolors', JSON.stringify(themeColors));
      
      // This will apply the theme to the root element.
      // Note: This simplified approach primarily affects the light theme.
      // A more robust solution would involve separate color definitions for dark mode.
      const root = document.documentElement;
      if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
      if (themeColors.background) root.style.setProperty('--background', themeColors.background);
      if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
    }
  }, [themeColors, isMounted]);


  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const addMultipleProducts = (newProducts: Product[]) => {
    setProducts((prevProducts) => {
      // This ensures we don't add products with barcodes that already exist.
      const existingBarcodes = new Set(prevProducts.map((p) => p.barcode));
      const uniqueNewProducts = newProducts.filter(
        (p) => !existingBarcodes.has(p.barcode)
      );
      return [...prevProducts, ...uniqueNewProducts];
    });
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };
  
  const processSale = (cartItems: InvoiceItem[]) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      for (const item of cartItems) {
        const productIndex = newProducts.findIndex(p => p.id === item.product.id);
        if (productIndex > -1) {
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            quantity: newProducts[productIndex].quantity - item.quantity
          };
        }
      }
      return newProducts;
    });

    const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        customerName: `POS Sale`,
        items: cartItems,
        subtotal,
        tax,
        total,
        createdAt: new Date(),
        type: 'pos',
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-${Date.now()}`,
      createdAt: new Date(),
    };
    setInvoices(prev => [newInvoice, ...prev]);
  }


  const value = {
    products,
    invoices,
    addProduct,
    updateProduct,
    deleteProduct,
    addMultipleProducts,
    processSale,
    addInvoice,
    activeModules,
    setActiveModules,
    shopInfo,
    setShopInfo,
    themeColors,
    setThemeColors,
    isMounted,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
