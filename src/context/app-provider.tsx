"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, ActiveModules, InvoiceItem, Invoice } from '@/lib/types';
import { sampleProducts } from '@/lib/data';

interface AppContextType {
  products: Product[];
  invoices: Invoice[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  processSale: (cartItems: InvoiceItem[]) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  activeModules: ActiveModules;
  setActiveModules: React.Dispatch<React.SetStateAction<ActiveModules>>;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialModules: ActiveModules = {
  stock: true,
  invoicing: true,
  barcode: true,
  pos: true,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);

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

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
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
    processSale,
    addInvoice,
    activeModules,
    setActiveModules,
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
