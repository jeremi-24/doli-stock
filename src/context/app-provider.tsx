
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Produit, Categorie, Vente, VentePayload, ActiveModules, ShopInfo, ThemeColors, FactureModele, Entrepot, AssignationPayload, CurrentUser, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Client } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  entrepots: Entrepot[];
  clients: Client[];
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
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  addVente: (venteData: VentePayload) => Promise<void>;
  deleteVente: (venteId: number) => Promise<void>;
  addFactureModele: (modele: Omit<FactureModele, 'id'>) => Promise<void>;
  updateFactureModele: (modele: FactureModele) => Promise<void>;
  deleteFactureModele: (modeleId: string) => Promise<void>;
  createInventaire: (payload: InventairePayload, isFirst: boolean) => Promise<Inventaire | null>;
  addReapprovisionnement: (payload: ReapproPayload) => Promise<Reapprovisionnement | null>;
  activeModules: ActiveModules;
  setActiveModules: React.Dispatch<React.SetStateAction<ActiveModules>>;
  shopInfo: ShopInfo;
  setShopInfo: (org: ShopInfo) => Promise<void>;
  themeColors: ThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  isMounted: boolean;
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (token: string) => void;
  logout: () => void;
  scannedProductDetails: any | null;
  setScannedProductDetails: (details: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialModules: ActiveModules = { stock: true, invoicing: true, barcode: true, pos: true };
const initialShopInfo: ShopInfo = { nom: 'StockHero', adresse: 'Boulevard du 13 Janvier', ville: 'Lomé', telephone: '+228 90 00 00 00', email: 'contact@stockhero.tg' };
const initialThemeColors: ThemeColors = { primary: '221 48% 48%', background: '220 13% 96%', accent: '262 52% 50%' };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [factureModeles, setFactureModeles] = useState<FactureModele[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModules>(initialModules);
  const [shopInfo, setShopInfoState] = useState<ShopInfo>(initialShopInfo);
  const [themeColors, setThemeColors] = useState<ThemeColors>(initialThemeColors);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [scannedProductDetails, setScannedProductDetails] = useState<any | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('stockhero_token');
    // Clear data to avoid flashing old content
    setProduits([]);
    setCategories([]);
    setEntrepots([]);
    setClients([]);
    setVentes([]);
    setFactureModeles([]);
    router.push('/login');
  }, [router]);

  const fetchAllData = useCallback(async () => {
    const handleFetchError = (error: unknown, resourceName: string) => {
        const description = (error instanceof Error) ? error.message : `Erreur inconnue lors du chargement: ${resourceName}`;
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger: ${resourceName}. ${description}` });
        if (description.includes('401') || description.includes('403')) {
          logout();
        }
    };
    try {
        const orgs = await api.getOrganisations();
        if (orgs && orgs.length > 0) {
            setShopInfoState(orgs[0]);
        }
    } catch (error) {
        handleFetchError(error, 'Organisation');
    }
    try {
        const produitsData = await api.getProducts();
        setProduits(produitsData || []);
    } catch (error) {
        handleFetchError(error, 'Produits');
    }
    try {
        const categoriesData = await api.getCategories();
        setCategories(categoriesData || []);
    } catch (error) {
        handleFetchError(error, 'Catégories');
    }
    try {
        const entrepotsData = await api.getEntrepots();
        setEntrepots(entrepotsData || []);
    } catch (error) {
        handleFetchError(error, 'Entrepôts');
    }
    try {
        const clientsData = await api.getClients();
        setClients(clientsData || []);
    } catch (error) {
        handleFetchError(error, 'Clients');
    }
    try {
        const ventesData = await api.getVentes();
        setVentes(ventesData || []);
    } catch (error) {
        handleFetchError(error, 'Ventes');
    }
  }, [toast, logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem('stockhero_token');
    if (storedToken) {
      try {
        const decoded: { sub: string, roles: string[] } = jwtDecode(storedToken);
        const user = { email: decoded.sub, role: decoded.roles?.[0] || 'USER' };
        setToken(storedToken);
        setCurrentUser(user);
      } catch (error) {
        console.error('Invalid token in storage, logging out.', error);
        logout();
      }
    }
    
    const storedModules = localStorage.getItem('stockhero_modules');
    if (storedModules) setActiveModules(JSON.parse(storedModules));

    const storedThemeColors = localStorage.getItem('stockhero_themecolors');
    if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
    
    setIsMounted(true);
  }, [logout]);

  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    if (isMounted && token && !isAuthPage) {
        fetchAllData();
    }
  }, [isMounted, token, fetchAllData, pathname]);
  
  useEffect(() => { if (isMounted) localStorage.setItem('stockhero_modules', JSON.stringify(activeModules)); }, [activeModules, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_themecolors', JSON.stringify(themeColors));
      const root = document.documentElement;
      if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
      if (themeColors.background) root.style.setProperty('--background', themeColors.background);
      if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
    }
  }, [themeColors, isMounted]);

  const login = (newToken: string) => {
    try {
      const decoded: { sub: string, roles: string[] } = jwtDecode(newToken);
      const user = { email: decoded.sub, role: decoded.roles?.[0] || 'USER' };
      localStorage.setItem('stockhero_token', newToken);
      setToken(newToken);
      setCurrentUser(user);
    } catch (e) {
      console.error("Failed to decode token", e);
      toast({ variant: 'destructive', title: 'Erreur de connexion', description: 'Le token reçu est invalide.' });
      logout();
    }
  };
  
  const setShopInfo = useCallback(async (orgData: ShopInfo) => {
    try {
        await api.saveOrganisation(orgData);
        await fetchAllData();
        toast({ title: "Informations de l'organisation mises à jour" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: "Erreur de sauvegarde", description: errorMessage });
        throw error;
    }
  }, [fetchAllData, toast]);

  const addCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'nProd'>) => { await api.createCategory(data); await fetchAllData(); }, [fetchAllData]);
  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => { await api.updateCategory(id, data); await fetchAllData(); }, [fetchAllData]);
  const deleteCategories = useCallback(async (ids: number[]) => { await api.deleteCategories(ids); await fetchAllData(); }, [fetchAllData]);

  const addEntrepot = useCallback(async (data: Omit<Entrepot, 'id' | 'quantite' | 'valeurVente'>) => { await api.createEntrepot(data); await fetchAllData(); }, [fetchAllData]);
  const updateEntrepot = useCallback(async (id: number, data: Partial<Entrepot>) => { await api.updateEntrepot(id, data); await fetchAllData(); }, [fetchAllData]);
  const deleteEntrepots = useCallback(async (ids: number[]) => { await api.deleteEntrepots(ids); await fetchAllData(); }, [fetchAllData]);

  const addProduit = useCallback(async (data: Omit<Produit, 'id'>) => { await api.createProduct(data); await fetchAllData(); }, [fetchAllData]);
  const updateProduit = useCallback(async (data: Produit) => { await api.updateProduct(data.id, data); await fetchAllData(); }, [fetchAllData]);
  const deleteProduits = useCallback(async (ids: number[]) => { await api.deleteProducts(ids); await fetchAllData(); }, [fetchAllData]);
  const assignProduits = useCallback(async (data: AssignationPayload) => { await api.assignProducts(data); await fetchAllData(); }, [fetchAllData]);
  const addMultipleProduits = useCallback(async () => { await fetchAllData(); }, [fetchAllData]);
  
  const addClient = useCallback(async (data: Omit<Client, 'id'>) => { await api.createClient(data); await fetchAllData(); }, [fetchAllData]);
  const updateClient = useCallback(async (id: number, data: Partial<Client>) => { await api.updateClient(id, data); await fetchAllData(); }, [fetchAllData]);
  const deleteClient = useCallback(async (id: number) => {
    try {
        await api.deleteClient(id);
        await fetchAllData();
        toast({ title: "Client supprimé" });
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de suppression', description: errorMessage});
    }
  }, [fetchAllData, toast]);

  const addVente = useCallback(async (venteData: VentePayload) => {
    try {
      await api.createVente(venteData);
      await fetchAllData(); // Refetch everything to update stock and sales list
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
       toast({ variant: 'destructive', title: 'Erreur de Vente', description: errorMessage});
       throw error; // re-throw to allow caller to handle UI state
    }
  }, [fetchAllData, toast]);

  const deleteVente = useCallback(async (venteId: number) => {
    try {
        await api.deleteVente(venteId);
        await fetchAllData();
        toast({ title: "Vente supprimée avec succès" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de suppression', description: errorMessage });
    }
  }, [fetchAllData, toast]);


  const addFactureModele = useCallback(async (modeleData: Omit<FactureModele, 'id'>) => {
    // await api.createFactureModele(modeleData);
    // await fetchAllData();
  }, []);
  const updateFactureModele = useCallback(async (updatedModele: FactureModele) => {
    // await api.updateFactureModele(updatedModele.id, updatedModele);
    // await fetchAllData();
  }, []);
  const deleteFactureModele = useCallback(async (modeleId: string) => {
    // await api.deleteFactureModele(modeleId);
    // await fetchAllData();
  }, []);

  const createInventaire = useCallback(async (payload: InventairePayload, isFirst: boolean): Promise<Inventaire | null> => {
    try {
      const newInventaire = await api.createInventaire(payload, isFirst);
      // This will refresh product quantities after inventory adjustment
      await fetchAllData();
      toast({ title: "Inventaire enregistré avec succès" });
      return newInventaire;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: 'destructive', title: 'Erreur d\'enregistrement', description: errorMessage });
      return null;
    }
  }, [fetchAllData, toast]);

  const addReapprovisionnement = useCallback(async (payload: ReapproPayload): Promise<Reapprovisionnement | null> => {
    try {
      const newReappro = await api.createReapprovisionnement(payload);
      // This will refresh product quantities after restocking
      await fetchAllData();
      toast({ title: "Réapprovisionnement enregistré avec succès" });
      return newReappro;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: 'destructive', title: 'Erreur d\'enregistrement', description: errorMessage });
      return null;
    }
  }, [fetchAllData, toast]);

  const value = useMemo(() => ({
    produits, categories, entrepots, clients, ventes, factureModeles,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addEntrepot, updateEntrepot, deleteEntrepots,
    addClient, updateClient, deleteClient,
    addVente, deleteVente, 
    addFactureModele, updateFactureModele, deleteFactureModele,
    createInventaire,
    addReapprovisionnement,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted,
    isAuthenticated: !!token,
    currentUser,
    login,
    logout,
    scannedProductDetails, 
    setScannedProductDetails,
  }), [
    produits, categories, entrepots, clients, ventes, factureModeles,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addEntrepot, updateEntrepot, deleteEntrepots,
    addClient, updateClient, deleteClient,
    addVente, deleteVente,
    addFactureModele, updateFactureModele, deleteFactureModele,
    createInventaire,
    addReapprovisionnement,
    activeModules, setActiveModules, shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, token, logout, currentUser, scannedProductDetails,
    login, fetchAllData
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
