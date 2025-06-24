"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, ActiveModules } from '@/lib/types';
import { sampleProducts } from '@/lib/data';

interface AppContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  activeModules: ActiveModules;
  setActiveModules: React.Dispatch<React.SetStateAction<ActiveModules>>;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialModules: ActiveModules = {
  stock: true,
  invoicing: true,
  barcode: true,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('stockhero_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(sampleProducts);
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

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
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
