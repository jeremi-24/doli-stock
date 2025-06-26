
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Produit, Categorie, Vente, VenteLigne, ActiveModules, ShopInfo, ThemeColors, FactureModele, Entrepot, AssignationPayload, PaginatedProduits } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PaginationState = Omit<PaginatedProduits, 'content'> | null;

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  entrepots: Entrepot[];
  ventes: Vente[];
  factureModeles: FactureModele[];
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (produit: Produit) => Promise<void>;
  deleteProduits: (produitIds: number[]) => Promise<void>;
  assignProduits: (data: AssignationPayload) => Promise<void>;
  addMultipleProduits: (newProducts: any[]) => Promise<void>;
  addCategorie: (categorie: Omit<Categorie, 'id' | 'nProd'>) => Promise<void>;
  updateCategorie: (id: number, categorie: Partial<Categorie>) => Promise<void>;
  deleteCategories: (categorieIds: number[]) => Promise<void>;
  addEntrepot: (entrepot: Omit<Entrepot, 'id' | 'quantite' | 'valeurVente'>) => Promise<void>;
  updateEntrepot: (id: number, entrepot: Partial<Entrepot>) => Promise<void>;
  deleteEntrepots: (entrepotIds: number[]) => Promise<void>;
  addVente: (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => Promise<void>;
  addFactureModele: (modele: Omit<FactureModele, 'id'>) => Promise<void>;
  updateFactureModele: (modele: FactureModele) => Promise<void>;
  deleteFactureModele: (modeleId: string) => Promise<void>;
  activeModules: ActiveModules;
  setActiveModules: React.Dispatch<React.SetStateAction<ActiveModules>>;
  shopInfo: ShopInfo;
  setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
  themeColors: ThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  isMounted: boolean;
  pagination: PaginationState;
  fetchProduitsPage: (page: number, size?: number) => Promise<void>;
  isProduitsLoading: boolean;
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
  const [pagination, setPagination] = useState<PaginationState>(null);
  const [isProduitsLoading, setIsProduitsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchProduitsPage = useCallback(async (page: number = 0, size: number = 10) => {
    setIsProduitsLoading(true);
    try {
        const response = await api.getProducts(page, size);
        const { content, ...paginationInfo } = response;
        setProduits(content || []);
        setPagination(paginationInfo);
    } catch (error) {
        const description = (error instanceof Error) ? error.message : 'Erreur inconnue';
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger les produits: ${description}` });
        setProduits([]);
    } finally {
        setIsProduitsLoading(false);
    }
  }, [toast]);
  
  const fetchStaticData = useCallback(async () => {
    const [categoriesResult, entrepotsResult, factureModelesResult] = await Promise.allSettled([
      api.getCategories(),
      api.getEntrepots(),
      api.getFactureModeles(),
    ]);

    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value || []);
    } else {
      console.error("Failed to fetch categories:", categoriesResult.reason);
      const description = (categoriesResult.reason instanceof Error) ? categoriesResult.reason.message : 'Erreur inconnue';
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger les catégories: ${description}` });
      setCategories([]);
    }
    
    if (entrepotsResult.status === 'fulfilled') {
      setEntrepots(entrepotsResult.value || []);
    } else {
      console.error("Failed to fetch entrepots:", entrepotsResult.reason);
      const description = (entrepotsResult.reason instanceof Error) ? entrepotsResult.reason.message : 'Erreur inconnue';
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger les entrepôts: ${description}` });
      setEntrepots([]);
    }

    if (factureModelesResult.status === 'fulfilled') {
      setFactureModeles(factureModelesResult.value || []);
    } else {
      console.error("Failed to fetch invoice templates:", factureModelesResult.reason);
      const description = (factureModelesResult.reason instanceof Error) ? factureModelesResult.reason.message : 'Erreur inconnue';
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger les modèles de facture: ${description}` });
      setFactureModeles([]);
    }

  }, [toast]);


  useEffect(() => {
    const loadInitialData = async () => {
      await fetchStaticData();
      await fetchProduitsPage(0, 10);
      
      const storedVentes = localStorage.getItem('stockhero_ventes');
      if (storedVentes) setVentes(JSON.parse(storedVentes).map((v: Vente) => ({ ...v, date_vente: new Date(v.date_vente) })));
      
      const storedModules = localStorage.getItem('stockhero_modules');
      if (storedModules) setActiveModules(JSON.parse(storedModules));
      const storedShopInfo = localStorage.getItem('stockhero_shopinfo');
      if (storedShopInfo) setShopInfo(JSON.parse(storedShopInfo));
      const storedThemeColors = localStorage.getItem('stockhero_themecolors');
      if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
      
      setIsMounted(true);
    };
    loadInitialData();
  }, [fetchStaticData, fetchProduitsPage]);
  
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_ventes', JSON.stringify(ventes)); }, [ventes, isMounted]);
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
  
  const refetchCurrentPage = useCallback(() => {
      if (pagination) {
        fetchProduitsPage(pagination.number, pagination.size);
      } else {
        fetchProduitsPage();
      }
  }, [pagination, fetchProduitsPage]);

  const addCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'nProd'>) => { await api.createCategory(data); await fetchStaticData(); }, [fetchStaticData]);
  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => { await api.updateCategory(id, data); await fetchStaticData(); }, [fetchStaticData]);
  const deleteCategories = useCallback(async (ids: number[]) => { await api.deleteCategories(ids); await fetchStaticData(); }, [fetchStaticData]);

  const addEntrepot = useCallback(async (data: Omit<Entrepot, 'id' | 'quantite' | 'valeurVente'>) => { await api.createEntrepot(data); await fetchStaticData(); }, [fetchStaticData]);
  const updateEntrepot = useCallback(async (id: number, data: Partial<Entrepot>) => { await api.updateEntrepot(id, data); await fetchStaticData(); }, [fetchStaticData]);
  const deleteEntrepots = useCallback(async (ids: number[]) => { await api.deleteEntrepots(ids); await fetchStaticData(); }, [fetchStaticData]);

  const addProduit = useCallback(async (data: Omit<Produit, 'id'>) => { await api.createProduct(data); await refetchCurrentPage(); }, [refetchCurrentPage]);
  const updateProduit = useCallback(async (data: Produit) => { await api.updateProduct(data.id, data); await refetchCurrentPage(); }, [refetchCurrentPage]);
  const deleteProduits = useCallback(async (ids: number[]) => { await api.deleteProducts(ids); await refetchCurrentPage(); }, [refetchCurrentPage]);
  const assignProduits = useCallback(async (data: AssignationPayload) => { await api.assignProducts(data); await refetchCurrentPage(); }, [refetchCurrentPage]);
  const addMultipleProduits = useCallback(async () => { await refetchCurrentPage(); }, [refetchCurrentPage]);
  
  const addVente = useCallback(async (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
    // This function will now be less accurate as it might not have all products in memory.
    // A more robust solution might be needed if products not on the current page are sold.
    // For now, it works with the currently loaded products.
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
      await refetchCurrentPage();
      const newVente: Vente = { ...venteData, id: Date.now(), date_vente: new Date(), reste: venteData.montant_total - venteData.montant_paye };
      setVentes(prev => [newVente, ...prev]);
    } catch (error) {
       console.error("Failed to update stock during sale:", error);
       toast({ variant: 'destructive', title: 'Erreur de Vente', description: "La mise à jour du stock a échoué."});
    }
  }, [produits, refetchCurrentPage, toast]);

  const addFactureModele = useCallback(async (modeleData: Omit<FactureModele, 'id'>) => {
    await api.createFactureModele(modeleData);
    await fetchStaticData();
  }, [fetchStaticData]);
  const updateFactureModele = useCallback(async (updatedModele: FactureModele) => {
    await api.updateFactureModele(updatedModele.id, updatedModele);
    await fetchStaticData();
  }, [fetchStaticData]);
  const deleteFactureModele = useCallback(async (modeleId: string) => {
    await api.deleteFactureModele(modeleId);
    await fetchStaticData();
  }, [fetchStaticData]);

  const value = useMemo(() => ({
    produits, categories, entrepots, ventes, factureModeles,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addEntrepot, updateEntrepot, deleteEntrepots,
    addVente, addFactureModele, updateFactureModele, deleteFactureModele,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, pagination, fetchProduitsPage, isProduitsLoading,
  }), [
    produits, categories, entrepots, ventes, factureModeles,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addEntrepot, updateEntrepot, deleteEntrepots,
    addVente, addFactureModele, updateFactureModele, deleteFactureModele,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors,
    isMounted, pagination, fetchProduitsPage, isProduitsLoading
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

    