
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Produit, Categorie, Vente, VenteLigne, ActiveModules, ShopInfo, ThemeColors, FactureModele } from '@/lib/types';
import { sampleProduits, sampleCategories, sampleFactureModeles } from '@/lib/data';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  ventes: Vente[];
  factureModeles: FactureModele[];
  addProduit: (produit: Omit<Produit, 'id'>) => void;
  updateProduit: (produit: Produit) => void;
  deleteProduit: (produitId: number) => void;
  addMultipleProduits: (produits: Omit<Produit, 'id'>[]) => void;
  fetchCategories: () => Promise<void>;
  addCategorie: (categorie: Omit<Categorie, 'id'>) => Promise<void>;
  updateCategorie: (id: number, categorie: Partial<Categorie>) => Promise<void>;
  deleteCategorie: (categorieId: number) => Promise<void>;
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

const initialModules: ActiveModules = { stock: true, invoicing: true, barcode: true, pos: true };
const initialShopInfo: ShopInfo = { name: 'Ma Boutique Togo', address: 'Boulevard du 13 Janvier, Lomé, Togo', phone: '+228 90 00 00 00', email: 'contact@boutique.tg' };
const initialThemeColors: ThemeColors = { primary: '231 48% 48%', background: '220 13% 96%', accent: '262 52% 50%' };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [factureModeles, setFactureModeles] = useState<FactureModele[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);
  const [shopInfo, setShopInfo] = useState<ShopInfo>(initialShopInfo);
  const [themeColors, setThemeColors] = useState<ThemeColors>(initialThemeColors);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const apiCategories = await api.getCategories();
      setCategories(apiCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les catégories.';
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion au Backend',
        description: `${description} Utilisation des données locales de démo.`,
      });
      setCategories(sampleCategories); // Fallback to sample data
    }
  }, [toast]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCategories();

        // Continue loading other data from localStorage
        const storedProduits = localStorage.getItem('stockhero_produits');
        setProduits(storedProduits ? JSON.parse(storedProduits) : sampleProduits);
        
        const storedVentes = localStorage.getItem('stockhero_ventes');
        if (storedVentes) setVentes(JSON.parse(storedVentes).map((v: Vente) => ({ ...v, date_vente: new Date(v.date_vente) })));

        const storedFactureModeles = localStorage.getItem('stockhero_facture_modeles');
        setFactureModeles(storedFactureModeles ? JSON.parse(storedFactureModeles) : sampleFactureModeles);

        const storedModules = localStorage.getItem('stockhero_modules');
        if (storedModules) setActiveModules(JSON.parse(storedModules));

        const storedShopInfo = localStorage.getItem('stockhero_shopinfo');
        if (storedShopInfo) setShopInfo(JSON.parse(storedShopInfo));
        
        const storedThemeColors = localStorage.getItem('stockhero_themecolors');
        if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
      } catch (error) {
        console.error("Failed to access localStorage or load initial data", error);
        // Fallback to sample data
        setProduits(sampleProduits);
        setFactureModeles(sampleFactureModeles);
      } finally {
        setIsMounted(true);
      }
    };
    loadInitialData();
  }, [fetchCategories]);
  
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_produits', JSON.stringify(produits)); }, [produits, isMounted]);
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


  // CRUD CATEGORIES (API-driven)
  const addCategorie = async (categorieData: Omit<Categorie, 'id'>) => {
    await api.createCategory(categorieData);
    await fetchCategories();
  };
  const updateCategorie = async (id: number, updatedCategorie: Partial<Categorie>) => {
    await api.updateCategory(id, updatedCategorie);
    await fetchCategories();
  };
  const deleteCategorie = async (categorieId: number) => {
    await api.deleteCategory(categorieId);
    await fetchCategories();
  };

  // CRUD PRODUITS (Local for now)
  const addProduit = (produitData: Omit<Produit, 'id'>) => {
    const newProduit: Produit = { id: Date.now(), ...produitData };
    setProduits((prev) => [...prev, newProduit]);
  };
  const updateProduit = (updatedProduit: Produit) => {
    setProduits((prev) => prev.map((p) => (p.id === updatedProduit.id ? updatedProduit : p)));
  };
  const deleteProduit = (produitId: number) => {
    setProduits((prev) => prev.filter((p) => p.id !== produitId));
  };
  const addMultipleProduits = (newProduits: Omit<Produit, 'id'>[]) => {
    setProduits((prevProduits) => {
      const existingBarcodes = new Set(prevProduits.map((p) => p.code_barre));
      const uniqueNewProductsWithId: Produit[] = newProduits
        .filter(p => !existingBarcodes.has(p.code_barre))
        .map((p, index) => ({...p, id: Date.now() + index }));
      return [...prevProduits, ...uniqueNewProductsWithId];
    });
  };
  
  // GESTION VENTES (Local for now)
  const addVente = (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
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

    const newVente: Vente = {
      ...venteData,
      id: Date.now(),
      date_vente: new Date(),
      reste: venteData.montant_total - venteData.montant_paye,
    };
    setVentes(prev => [newVente, ...prev]);
  };

  // CRUD MODELES FACTURE (Local for now)
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
    fetchCategories,
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
