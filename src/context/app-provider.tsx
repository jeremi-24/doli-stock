
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Produit, Categorie, Vente, VenteLigne, ActiveModules, ShopInfo, ThemeColors, FactureModele, Entrepot } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  entrepots: Entrepot[];
  ventes: Vente[];
  factureModeles: FactureModele[];
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (produit: Produit) => Promise<void>;
  deleteProduit: (produitId: number) => Promise<void>;
  addMultipleProduits: (newProducts: any[]) => Promise<void>;
  addCategorie: (categorie: Omit<Categorie, 'id' | 'nbProduits'>) => Promise<void>;
  updateCategorie: (id: number, categorie: Partial<Categorie>) => Promise<void>;
  deleteCategorie: (categorieId: number) => Promise<void>;
  addEntrepot: (entrepot: Omit<Entrepot, 'id' | 'quantite' | 'valeurVente'>) => Promise<void>;
  updateEntrepot: (id: number, entrepot: Partial<Entrepot>) => Promise<void>;
  deleteEntrepot: (entrepotId: number) => Promise<void>;
  addVente: (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => Promise<void>;
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
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [factureModeles, setFactureModeles] = useState<FactureModele[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);
  const [shopInfo, setShopInfo] = useState<ShopInfo>(initialShopInfo);
  const [themeColors, setThemeColors] = useState<ThemeColors>(initialThemeColors);
  const { toast } = useToast();

  const fetchAppData = useCallback(async () => {
    try {
      const [apiCategories, apiEntrepots, apiProduits] = await Promise.all([
        api.getCategories(),
        api.getEntrepots(),
        api.getProducts()
      ]);
      setCategories(apiCategories || []);
      setEntrepots(apiEntrepots || []);
      setProduits(apiProduits || []);
    } catch (error) {
      console.error("Failed to fetch app data:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les données.';
      toast({ variant: 'destructive', title: 'Erreur de connexion au Backend', description: `${description} Les données ne peuvent pas être chargées.` });
      setCategories([]);
      setEntrepots([]);
      setProduits([]);
    }
  }, [toast]);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAppData();
      
      // Load local data
      const storedVentes = localStorage.getItem('stockhero_ventes');
      if (storedVentes) setVentes(JSON.parse(storedVentes).map((v: Vente) => ({ ...v, date_vente: new Date(v.date_vente) })));
      const storedFactureModeles = localStorage.getItem('stockhero_facture_modeles');
      setFactureModeles(storedFactureModeles ? JSON.parse(storedFactureModeles) : []);
      const storedModules = localStorage.getItem('stockhero_modules');
      if (storedModules) setActiveModules(JSON.parse(storedModules));
      const storedShopInfo = localStorage.getItem('stockhero_shopinfo');
      if (storedShopInfo) setShopInfo(JSON.parse(storedShopInfo));
      const storedThemeColors = localStorage.getItem('stockhero_themecolors');
      if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
      
      setIsMounted(true);
    };
    loadInitialData();
  }, [fetchAppData]);
  
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

  const addCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'nbProduits'>) => { await api.createCategory(data); await fetchAppData(); }, [fetchAppData]);
  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => { await api.updateCategory(id, data); await fetchAppData(); }, [fetchAppData]);
  const deleteCategorie = useCallback(async (id: number) => { await api.deleteCategory(id); await fetchAppData(); }, [fetchAppData]);

  const addEntrepot = useCallback(async (data: Omit<Entrepot, 'id' | 'quantite' | 'valeurVente'>) => { await api.createEntrepot(data); await fetchAppData(); }, [fetchAppData]);
  const updateEntrepot = useCallback(async (id: number, data: Partial<Entrepot>) => { await api.updateEntrepot(id, data); await fetchAppData(); }, [fetchAppData]);
  const deleteEntrepot = useCallback(async (id: number) => { await api.deleteEntrepot(id); await fetchAppData(); }, [fetchAppData]);

  const addProduit = useCallback(async (data: Omit<Produit, 'id'>) => { await api.createProduct(data); await fetchAppData(); }, [fetchAppData]);
  const updateProduit = useCallback(async (data: Produit) => { await api.updateProduct(data.id, data); await fetchAppData(); }, [fetchAppData]);
  const deleteProduit = useCallback(async (id: number) => { await api.deleteProduct(id); await fetchAppData(); }, [fetchAppData]);
  const addMultipleProduits = useCallback(async () => { await fetchAppData(); }, [fetchAppData]);
  
  const addVente = useCallback(async (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
    const updatePromises = venteData.lignes.map(ligne => {
      const productToUpdate = produits.find(p => p.id === ligne.produit.id);
      if (productToUpdate) {
        const newQuantity = productToUpdate.qte - ligne.quantite;
        return api.updateProduct(productToUpdate.id, { qte: newQuantity });
      }
      return Promise.resolve();
    });
    try {
      await Promise.all(updatePromises);
      await fetchAppData();
      const newVente: Vente = { ...venteData, id: Date.now(), date_vente: new Date(), reste: venteData.montant_total - venteData.montant_paye };
      setVentes(prev => [newVente, ...prev]);
    } catch (error) {
       console.error("Failed to update stock during sale:", error);
       toast({ variant: 'destructive', title: 'Erreur de Vente', description: "La mise à jour du stock a échoué."});
    }
  }, [produits, fetchAppData, toast]);

  const addFactureModele = useCallback((modeleData: Omit<FactureModele, 'id'>) => {
    const newModele: FactureModele = { id: `tmpl-${Date.now()}`, ...modeleData };
    setFactureModeles((prev) => [...prev, newModele]);
  }, []);
  const updateFactureModele = useCallback((updatedModele: FactureModele) => {
    setFactureModeles((prev) => prev.map((m) => (m.id === updatedModele.id ? updatedModele : m)));
  }, []);
  const deleteFactureModele = useCallback((modeleId: string) => {
    setFactureModeles((prev) => prev.filter((m) => m.id !== modeleId));
  }, []);

  const value = useMemo(() => ({
    produits, categories, entrepots, ventes, factureModeles,
    addProduit, updateProduit, deleteProduit, addMultipleProduits,
    addCategorie, updateCategorie, deleteCategorie,
    addEntrepot, updateEntrepot, deleteEntrepot,
    addVente, addFactureModele, updateFactureModele, deleteFactureModele,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted,
  }), [
    produits, categories, entrepots, ventes, factureModeles,
    addProduit, updateProduit, deleteProduit, addMultipleProduits,
    addCategorie, updateCategorie, deleteCategorie,
    addEntrepot, updateEntrepot, deleteEntrepot,
    addVente, addFactureModele, updateFactureModele, deleteFactureModele,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted
  ]);

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
