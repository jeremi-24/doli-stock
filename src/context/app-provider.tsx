
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
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (produit: Produit) => Promise<void>;
  deleteProduit: (produitId: number) => Promise<void>;
  fetchProduits: () => Promise<void>;
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

  // Helper to map backend product to frontend product
  const mapToFrontendProduit = (backendProduit: any, categoriesList: Categorie[]): Produit => {
    const categorie = categoriesList.find(c => c.nom === backendProduit.categorie);
    return {
      id: backendProduit.id,
      nom: backendProduit.nom,
      ref: backendProduit.ref,
      code_barre: backendProduit.codeBarre,
      categorie_id: categorie ? categorie.id : 0,
      prix_achat: backendProduit.prixAchat || 0,
      prix_vente: backendProduit.prix,
      quantite_stock: backendProduit.qte,
      unite: backendProduit.unite || 'pièce',
      alerte_stock: backendProduit.qteMin || backendProduit.alerte_stock || 0,
    };
  };

  // Helper to map frontend product to backend product for POST/PUT
  const mapToBackendProduit = (frontendProduit: Partial<Produit>, categoriesList: Categorie[]) => {
      const categorie = categoriesList.find(c => c.id === frontendProduit.categorie_id);
      return {
        id: frontendProduit.id,
        nom: frontendProduit.nom,
        ref: frontendProduit.ref,
        qte: frontendProduit.quantite_stock,
        qteMin: frontendProduit.alerte_stock,
        prix: frontendProduit.prix_vente,
        prixAchat: frontendProduit.prix_achat,
        codeBarre: frontendProduit.code_barre,
        unite: frontendProduit.unite,
        categorie: categorie ? categorie.nom : '',
      };
  }

  const fetchCategories = useCallback(async () => {
    try {
      const apiCategories = await api.getCategories();
      setCategories(apiCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les catégories.';
      toast({ variant: 'destructive', title: 'Erreur de connexion au Backend', description: `${description} Utilisation des données locales de démo.`});
      setCategories(sampleCategories);
    }
  }, [toast]);

  const fetchProduits = useCallback(async () => {
    try {
      const apiProduits = await api.getProducts();
      // Ensure categories are available for mapping
      setProduits(prevProduits => {
        const categoriesToMap = categories.length > 0 ? categories : sampleCategories;
        return apiProduits.map(p => mapToFrontendProduit(p, categoriesToMap));
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      const description = (error instanceof Error) ? error.message : 'Impossible de charger les produits.';
      toast({ variant: 'destructive', title: 'Erreur de connexion au Backend', description: `${description} Utilisation des données locales de démo.` });
      setProduits(sampleProduits);
    }
  }, [toast, categories]);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      await fetchProduits();
      
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
  }, []); // Run only once on mount

  
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


  // API-driven CRUD
  const addCategorie = async (categorieData: Omit<Categorie, 'id'>) => { await api.createCategory(categorieData); await fetchCategories(); };
  const updateCategorie = async (id: number, updatedCategorie: Partial<Categorie>) => { await api.updateCategory(id, updatedCategorie); await fetchCategories(); };
  const deleteCategorie = async (categorieId: number) => { await api.deleteCategory(categorieId); await fetchCategories(); };

  const addProduit = async (produitData: Omit<Produit, 'id'>) => {
    const backendPayload = mapToBackendProduit(produitData, categories);
    await api.createProduct(backendPayload);
    await fetchProduits();
  };
  const updateProduit = async (updatedProduit: Produit) => {
    const backendPayload = mapToBackendProduit(updatedProduit, categories);
    await api.updateProduct(updatedProduit.id, backendPayload);
    await fetchProduits();
  };
  const deleteProduit = async (produitId: number) => {
    await api.deleteProduct(produitId);
    await fetchProduits();
  };

  const addMultipleProduits = async (importedData: any[]) => {
    // Assuming the import API returns products and we just need to refetch
    await fetchProduits();
  };
  
  // GESTION VENTES (Local for now)
  const addVente = (venteData: Omit<Vente, 'id' | 'date_vente' | 'reste'>) => {
    // This logic should be moved to backend eventually
    const updatedProduits = [...produits];
    for (const ligne of venteData.lignes) {
      const productIndex = updatedProduits.findIndex(p => p.id === ligne.produit.id);
      if (productIndex > -1) {
        updatedProduits[productIndex].quantite_stock -= ligne.quantite;
        // Call API to update product quantity on the backend
        updateProduit(updatedProduits[productIndex]); 
      }
    }
    setProduits(updatedProduits);

    const newVente: Vente = { ...venteData, id: Date.now(), date_vente: new Date(), reste: venteData.montant_total - venteData.montant_paye };
    setVentes(prev => [newVente, ...prev]);
  };

  // CRUD MODELES FACTURE (Local for now)
  const addFactureModele = (modeleData: Omit<FactureModele, 'id'>) => { const newModele: FactureModele = { id: `tmpl-${Date.now()}`, ...modeleData }; setFactureModeles((prev) => [...prev, newModele]); };
  const updateFactureModele = (updatedModele: FactureModele) => { setFactureModeles((prev) => prev.map((m) => (m.id === updatedModele.id ? updatedModele : m))); };
  const deleteFactureModele = (modeleId: string) => { setFactureModeles((prev) => prev.filter((m) => m.id !== modeleId)); };


  const value = {
    produits,
    categories,
    ventes,
    factureModeles,
    addProduit,
    updateProduit,
    deleteProduit,
    fetchProduits,
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
