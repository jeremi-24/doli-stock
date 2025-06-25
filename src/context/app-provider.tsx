
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Produit, Categorie, Vente, VenteLigne, ActiveModules, ShopInfo, ThemeColors, FactureModele } from '@/lib/types';
import { sampleProduits, sampleCategories, sampleFactureModeles } from '@/lib/data';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  ventes: Vente[];
  factureModeles: FactureModele[];
  addProduit: (produit: Omit<Produit, 'id'>) => void;
  updateProduit: (produit: Produit) => void;
  deleteProduit: (produitId: string) => void;
  addMultipleProduits: (produits: Produit[]) => void;
  addCategorie: (categorie: Omit<Categorie, 'id'>) => void;
  updateCategorie: (categorie: Categorie) => void;
  deleteCategorie: (categorieId: string) => void;
  addVente: (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => void;
  addFactureModele: (modele: Omit<FactureModele, 'id'>) => void;
  updateFactureModele: (modele: FactureModele) => void;
  deleteFactureModele: (modeleId: string) => void;
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
  name: 'Ma Boutique Togo',
  address: 'Boulevard du 13 Janvier, Lomé, Togo',
  phone: '+228 90 00 00 00',
  email: 'contact@boutique.tg',
};

const initialThemeColors: ThemeColors = {
  primary: '231 48% 48%',
  background: '220 13% 96%',
  accent: '262 52% 50%',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [factureModeles, setFactureModeles] = useState<FactureModele[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);
  const [shopInfo, setShopInfo] = useState<ShopInfo>(initialShopInfo);
  const [themeColors, setThemeColors] = useState<ThemeColors>(initialThemeColors);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedProduits = localStorage.getItem('stockhero_produits');
      setProduits(storedProduits ? JSON.parse(storedProduits) : sampleProduits);

      const storedCategories = localStorage.getItem('stockhero_categories');
      setCategories(storedCategories ? JSON.parse(storedCategories) : sampleCategories);
      
      const storedVentes = localStorage.getItem('stockhero_ventes');
      if (storedVentes) {
        const parsedVentes = JSON.parse(storedVentes).map((v: Vente) => ({
            ...v,
            date_vente: new Date(v.date_vente)
        }));
        setVentes(parsedVentes);
      }

      const storedFactureModeles = localStorage.getItem('stockhero_facture_modeles');
      setFactureModeles(storedFactureModeles ? JSON.parse(storedFactureModeles) : sampleFactureModeles);

      const storedModules = localStorage.getItem('stockhero_modules');
      if (storedModules) setActiveModules(JSON.parse(storedModules));

      const storedShopInfo = localStorage.getItem('stockhero_shopinfo');
      if (storedShopInfo) setShopInfo(JSON.parse(storedShopInfo));

      const storedThemeColors = localStorage.getItem('stockhero_themecolors');
      if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));

    } catch (error) {
      console.error("Failed to access localStorage", error);
      setProduits(sampleProduits);
      setCategories(sampleCategories);
      setFactureModeles(sampleFactureModeles);
    }
    setIsMounted(true);
  }, []);

  // Persist data to localStorage when it changes
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_produits', JSON.stringify(produits)); }, [produits, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_categories', JSON.stringify(categories)); }, [categories, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_ventes', JSON.stringify(ventes)); }, [ventes, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_facture_modeles', JSON.stringify(factureModeles)); }, [factureModeles, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_modules', JSON.stringify(activeModules)); }, [activeModules, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_shopinfo', JSON.stringify(shopInfo)); }, [shopInfo, isMounted]);
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_themecolors', JSON.stringify(themeColors));
      const root = document.documentElement;
      if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
      if (themeColors.background) root.style.setProperty('--background', themeColors.background);
      if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
    }
  }, [themeColors, isMounted]);

  // CRUD PRODUITS
  const addProduit = (produitData: Omit<Produit, 'id'>) => {
    const newProduit: Produit = { id: `prod-${Date.now()}`, ...produitData };
    setProduits((prev) => [...prev, newProduit]);
  };
  const updateProduit = (updatedProduit: Produit) => {
    setProduits((prev) => prev.map((p) => (p.id === updatedProduit.id ? updatedProduit : p)));
  };
  const deleteProduit = (produitId: string) => {
    setProduits((prev) => prev.filter((p) => p.id !== produitId));
  };
   const addMultipleProduits = (newProduits: Produit[]) => {
    setProduits((prevProduits) => {
      const existingBarcodes = new Set(prevProduits.map((p) => p.code_barre));
      const uniqueNewProducts = newProduits.filter(p => !existingBarcodes.has(p.code_barre));
      return [...prevProduits, ...uniqueNewProducts];
    });
  };

  // CRUD CATEGORIES
  const addCategorie = (categorieData: Omit<Categorie, 'id'>) => {
    const newCategorie: Categorie = { id: `cat-${Date.now()}`, ...categorieData };
    setCategories((prev) => [...prev, newCategorie]);
  };
  const updateCategorie = (updatedCategorie: Categorie) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCategorie.id ? updatedCategorie : c)));
  };
  const deleteCategorie = (categorieId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categorieId));
  };
  
  // GESTION VENTES
  const addVente = (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
    // 1. Mettre à jour le stock
    setProduits(prevProduits => {
      const newProduits = [...prevProduits];
      for (const ligne of venteData.lignes) {
        const productIndex = newProduits.findIndex(p => p.id === ligne.produit.id);
        if (productIndex > -1) {
          newProduits[productIndex] = {
            ...newProduits[productIndex],
            quantite_stock: newProduits[productIndex].quantite_stock - ligne.quantite
          };
        }
      }
      return newProduits;
    });

    // 2. Créer la nouvelle vente
    const newVente: Vente = {
      ...venteData,
      id: `VENTE-${Date.now()}`,
      date_vente: new Date(),
      reste: venteData.montant_total - venteData.montant_paye,
    };
    setVentes(prev => [newVente, ...prev]);
  };

  // CRUD MODELES FACTURE
  const addFactureModele = (modeleData: Omit<FactureModele, 'id'>) => {
    const newModele: FactureModele = { id: `tmpl-${Date.now()}`, ...modeleData };
    setFactureModeles((prev) => [...prev, newModele]);
  };
  const updateFactureModele = (updatedModele: FactureModele) => {
    setFactureModeles((prev) => prev.map((m) => (m.id === updatedModele.id ? updatedModele : m)));
  };
  const deleteFactureModele = (modeleId: string) => {
    setFactureModeles((prev) => prev.filter((m) => m.id !== modeleId));
  };


  const value = {
    produits,
    categories,
    ventes,
    factureModeles,
    addProduit,
    updateProduit,
    deleteProduit,
    addMultipleProduits,
    addCategorie,
    updateCategorie,
    deleteCategorie,
    addVente,
    addFactureModele,
    updateFactureModele,
    deleteFactureModele,
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
    throw new Error("useApp doit être utilisé à l'intérieur d'un AppProvider");
  }
  return context;
}
