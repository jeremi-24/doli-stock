
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Produit, Categorie, Vente, VenteLigne, ActiveModules, ShopInfo, ThemeColors, FactureModele } from '@/lib/types';
import { sampleProduits, sampleCategories, sampleFactureModeles } from '@/lib/data';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  ventes: Vente[];
  factureModeles: FactureModele[];
  addProduit: (produit: Omit<Produit, 'id' | 'code_barre'>) => Promise<void>;
  updateProduit: (produit: Produit) => Promise<void>;
  deleteProduit: (produitId: number) => Promise<void>;
  fetchProduits: () => Promise<void>;
  addMultipleProduits: (produits: Omit<Produit, 'id'>[]) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addCategorie: (categorie: Omit<Categorie, 'id' | 'nbProduits'>) => Promise<void>;
  updateCategorie: (id: number, categorie: Partial<Categorie>) => Promise<void>;
  deleteCategorie: (categorieId: number) => Promise<void>;
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
      return apiCategories;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les catégories.';
      toast({ variant: 'destructive', title: 'Erreur de connexion au Backend', description: `${description} Utilisation des données locales de démo.`});
      setCategories(sampleCategories);
      return sampleCategories;
    }
  }, [toast]);
  
  const fetchProduits = useCallback(async (currentCategories: Categorie[]) => {
    if (currentCategories.length === 0) return;
    const categoryNameToIdMap = new Map(currentCategories.map(c => [c.nom, c.id]));
    try {
      const apiProduits = await api.getProducts();
      const frontendProduits = apiProduits.map((p: any) => ({
        id: p.id,
        nom: p.nom,
        ref: p.ref,
        code_barre: p.codeBarre,
        prix_vente: p.prix,
        quantite_stock: p.qte,
        alerte_stock: p.qteMin || 0,
        categorieId: categoryNameToIdMap.get(p.categorie) ?? 0,
      }));
      setProduits(frontendProduits);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les produits.';
      toast({ variant: 'destructive', title: 'Erreur de connexion au Backend', description: `${description} Utilisation des données locales de démo.` });
      setProduits(sampleProduits);
    }
  }, [toast]);

  useEffect(() => {
    const loadInitialData = async () => {
      const fetchedCategories = await fetchCategories();
      await fetchProduits(fetchedCategories);
      
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
      
      setIsMounted(true);
    };
    loadInitialData();
  }, [fetchCategories, fetchProduits]);
  
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


  // API-driven CRUD for CATEGORIES
  const addCategorie = useCallback(async (categorieData: Omit<Categorie, 'id' | 'nbProduits'>) => {
    await api.createCategory(categorieData);
    await fetchCategories();
  }, [fetchCategories]);

  const updateCategorie = useCallback(async (id: number, updatedCategorie: Partial<Categorie>) => {
    await api.updateCategory(id, updatedCategorie);
    await fetchCategories();
  }, [fetchCategories]);

  const deleteCategorie = useCallback(async (categorieId: number) => {
    await api.deleteCategory(categorieId);
    await fetchCategories();
  }, [fetchCategories]);

  // API-driven CRUD for PRODUCTS
  const refetchProduits = useCallback(async () => {
    await fetchProduits(categories);
  }, [fetchProduits, categories]);

  const addProduit = useCallback(async (produitData: Omit<Produit, 'id' | 'code_barre'>) => {
    const categoryIdToNameMap = new Map(categories.map(c => [c.id, c.nom]));
    const ref = produitData.ref || `REF-${Date.now().toString().slice(-6)}`;
    const codeBarre = `MAN-${Date.now().toString().slice(-8)}`;
    const backendPayload = {
        nom: produitData.nom,
        ref: ref,
        qte: produitData.quantite_stock,
        qteMin: produitData.alerte_stock,
        prix: produitData.prix_vente,
        codeBarre: codeBarre,
        categorie: categoryIdToNameMap.get(produitData.categorieId),
    };
    await api.createProduct(backendPayload);
    await refetchProduits();
  }, [categories, refetchProduits]);

  const updateProduit = useCallback(async (updatedProduit: Produit) => {
    const categoryIdToNameMap = new Map(categories.map(c => [c.id, c.nom]));
    const backendPayload = {
      id: updatedProduit.id,
      nom: updatedProduit.nom,
      ref: updatedProduit.ref,
      qte: updatedProduit.quantite_stock,
      qteMin: updatedProduit.alerte_stock,
      prix: updatedProduit.prix_vente,
      codeBarre: updatedProduit.code_barre,
      categorie: categoryIdToNameMap.get(updatedProduit.categorieId),
    };
    await api.updateProduct(updatedProduit.id, backendPayload);
    await refetchProduits();
  }, [categories, refetchProduits]);

  const deleteProduit = useCallback(async (produitId: number) => {
    await api.deleteProduct(produitId);
    await refetchProduits();
  }, [refetchProduits]);

  const addMultipleProduits = useCallback(async (importedData: any[]) => {
    await refetchProduits();
  }, [refetchProduits]);
  
  // GESTION VENTES (Local for now)
  const addVente = useCallback(async (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
    const updatePromises = venteData.lignes.map(ligne => {
      const productToUpdate = produits.find(p => p.id === ligne.produit.id);
      if (productToUpdate) {
        const newQuantity = productToUpdate.quantite_stock - ligne.quantite;
        return api.updateProduct(productToUpdate.id, { qte: newQuantity });
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(updatePromises);
      await refetchProduits();
      const newVente: Vente = { ...venteData, id: Date.now(), date_vente: new Date(), reste: venteData.montant_total - venteData.montant_paye };
      setVentes(prev => [newVente, ...prev]);
    } catch (error) {
       console.error("Failed to update stock during sale:", error);
       toast({ variant: 'destructive', title: 'Erreur de Vente', description: "La mise à jour du stock a échoué."});
    }
  }, [produits, refetchProduits, toast]);

  // CRUD MODELES FACTURE (Local for now)
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
    produits,
    categories,
    ventes,
    factureModeles,
    addProduit,
    updateProduit,
    deleteProduit,
    fetchProduits: refetchProduits,
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
  }), [
    produits,
    categories,
    ventes,
    factureModeles,
    addProduit,
    updateProduit,
    deleteProduit,
    refetchProduits,
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
    shopInfo,
    themeColors,
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
