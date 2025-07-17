
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Produit, Categorie, LieuStock, AssignationPayload, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Client, ShopInfo, ThemeColors, CurrentUser, CommandePayload, Commande, Facture, BonLivraison } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  produits: Produit[];
  categories: Categorie[];
  lieuxStock: LieuStock[];
  clients: Client[];
  factures: Facture[];
  commandes: Commande[];
  bonLivraisons: BonLivraison[];
  fetchFactures: () => Promise<void>;
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (produit: Produit) => Promise<void>;
  deleteProduits: (produitIds: number[]) => Promise<void>;
  assignProduits: (data: AssignationPayload) => Promise<void>;
  addMultipleProduits: (newProducts: any[]) => Promise<void>;
  addCategorie: (categorie: Omit<Categorie, 'id' | 'nProd'>) => Promise<void>;
  updateCategorie: (id: number, categorie: Partial<Categorie>) => Promise<void>;
  deleteCategories: (categorieIds: number[]) => Promise<void>;
  addLieuStock: (lieuStock: Omit<LieuStock, 'id'>) => Promise<void>;
  updateLieuStock: (id: number, lieuStock: Partial<LieuStock>) => Promise<void>;
  deleteLieuxStock: (lieuStockIds: number[]) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  deleteFacture: (factureId: number) => Promise<void>;
  createInventaire: (payload: InventairePayload, isFirst: boolean) => Promise<Inventaire | null>;
  addReapprovisionnement: (payload: ReapproPayload) => Promise<Reapprovisionnement | null>;
  createCommande: (payload: CommandePayload) => Promise<Commande | null>;
  validerCommande: (commandeId: number) => Promise<void>;
  genererFacture: (commandeId: number) => Promise<void>;
  genererBonLivraison: (commandeId: number) => Promise<void>;
  validerLivraison: (livraisonId: number) => Promise<void>;
  shopInfo: ShopInfo;
  setShopInfo: (org: ShopInfo) => Promise<void>;
  themeColors: ThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  isMounted: boolean;
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
  scannedProductDetails: any | null;
  setScannedProductDetails: (details: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialShopInfo: ShopInfo = { nom: 'StockHero', adresse: '123 Rue Principale', ville: 'Lomé', telephone: '+228 90 00 00 00', email: 'contact@stockhero.dev' };
const initialThemeColors: ThemeColors = { primary: '221 48% 48%', background: '220 13% 96%', accent: '262 52% 50%' };
const ALLOWED_ROLES = ['ADMIN', 'USER', 'MAGASINIER', 'CONTROLEUR', 'DG'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [lieuxStock, setLieuxStock] = useState<LieuStock[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [bonLivraisons, setBonLivraisons] = useState<BonLivraison[]>([]);
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
    localStorage.removeItem('stockhero_user');
    // Clear data to avoid flashing old content
    setProduits([]);
    setCategories([]);
    setLieuxStock([]);
    setClients([]);
    setFactures([]);
    setCommandes([]);
    setBonLivraisons([]);
    router.push('/login');
  }, [router]);

  const handleFetchError = useCallback((error: unknown, resourceName: string) => {
      const description = (error instanceof api.ApiError) ? error.message : `Erreur inconnue lors du chargement: ${resourceName}`;
      toast({ variant: 'destructive', title: 'Erreur de chargement', description });
      if (error instanceof api.ApiError && (error.status === 401 || error.status === 403)) {
        setTimeout(() => logout(), 1500); // Give user time to read toast
      }
  }, [toast, logout]);

  const fetchFactures = useCallback(async () => {
    try {
        const data = await api.getFactures();
        setFactures(data || []);
    } catch (error) {
        handleFetchError(error, 'Factures');
    }
  }, [handleFetchError]);

  const fetchAllData = useCallback(async () => {
    try {
        const orgs = await api.getOrganisations();
        if (orgs && orgs.length > 0) {
            setShopInfoState(orgs[0]);
        }
    } catch (error) { handleFetchError(error, 'Organisation'); }
    try {
        const produitsData = await api.getProducts();
        setProduits(produitsData || []);
    } catch (error) { handleFetchError(error, 'Produits'); }
    try {
        const categoriesData = await api.getCategories();
        setCategories(categoriesData || []);
    } catch (error) { handleFetchError(error, 'Catégories'); }
    try {
        const lieuxStockData = await api.getLieuxStock();
        setLieuxStock(lieuxStockData || []);
    } catch (error) { handleFetchError(error, 'Lieux de Stock'); }
    try {
        const clientsData = await api.getClients();
        setClients(clientsData || []);
    } catch (error) { handleFetchError(error, 'Clients'); }
    try {
        const commandesData = await api.getCommandes();
        setCommandes(commandesData || []);
    } catch (error) { handleFetchError(error, 'Commandes'); }
     try {
        if(currentUser?.lieuId) {
            const livraisonsData = await api.getBonsLivraison(currentUser.lieuId);
            setBonLivraisons(livraisonsData || []);
        } else {
             setBonLivraisons([]);
        }
    } catch (error) { handleFetchError(error, 'Bons de Livraison'); }
    fetchFactures();
  }, [handleFetchError, fetchFactures, currentUser]);

  useEffect(() => {
    const storedToken = localStorage.getItem('stockhero_token');
    const storedUser = localStorage.getItem('stockhero_user');
    
    if (storedToken && storedUser) {
        try {
            const user: CurrentUser = JSON.parse(storedUser);
            if (user && user.role) {
                setToken(storedToken);
                setCurrentUser(user);
            } else {
                logout();
            }
        } catch (e) {
            logout();
        }
    }
    
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
  
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_themecolors', JSON.stringify(themeColors));
      const root = document.documentElement;
      if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
      if (themeColors.background) root.style.setProperty('--background', themeColors.background);
      if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
    }
  }, [themeColors, isMounted]);

  const login = (newToken: string, user: CurrentUser) => {
    if (!user || !user.role) {
        toast({ variant: 'destructive', title: 'Rôle manquant', description: 'Votre rôle n\'est pas défini.' });
        logout();
        return;
    }
    localStorage.setItem('stockhero_token', newToken);
    localStorage.setItem('stockhero_user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
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

  const addLieuStock = useCallback(async (data: Omit<LieuStock, 'id'>) => { await api.createLieuStock(data); await fetchAllData(); }, [fetchAllData]);
  const updateLieuStock = useCallback(async (id: number, data: Partial<LieuStock>) => { await api.updateLieuStock(id, data); await fetchAllData(); }, [fetchAllData]);
  const deleteLieuxStock = useCallback(async (ids: number[]) => { await api.deleteLieuxStock(ids); await fetchAllData(); }, [fetchAllData]);

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
        throw error;
    }
  }, [fetchAllData, toast]);

  const deleteFacture = useCallback(async (factureId: number) => {
    try {
        await api.deleteFacture(factureId);
        await fetchFactures();
        toast({ title: "Facture supprimée avec succès" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de suppression', description: errorMessage });
    }
  }, [fetchFactures, toast]);

  const createInventaire = useCallback(async (payload: InventairePayload, isFirst: boolean): Promise<Inventaire | null> => {
    try {
      const newInventaire = await api.createInventaire(payload, isFirst);
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
      await fetchAllData();
      toast({ title: "Réapprovisionnement enregistré avec succès" });
      return newReappro;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: 'destructive', title: 'Erreur d\'enregistrement', description: errorMessage });
      return null;
    }
  }, [fetchAllData, toast]);

  const createCommande = useCallback(async (payload: CommandePayload): Promise<Commande | null> => {
    try {
      const newCommande = await api.createCommande(payload);
      await fetchAllData();
      toast({ title: "Commande créée avec succès" });
      return newCommande;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de création', description: errorMessage });
        throw error;
    }
  }, [fetchAllData, toast]);

  const validerCommande = useCallback(async (commandeId: number) => {
    try {
      await api.validerCommande(commandeId);
      await fetchAllData();
      toast({ title: "Commande validée" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de validation', description: errorMessage });
    }
  }, [fetchAllData, toast]);

  const genererFacture = useCallback(async (commandeId: number) => {
    try {
      await api.genererFacture(commandeId);
      await fetchFactures();
      toast({ title: "Facture générée" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de génération', description: errorMessage });
    }
  }, [fetchFactures, toast]);

  const genererBonLivraison = useCallback(async (commandeId: number) => {
    try {
      await api.genererBonLivraison(commandeId);
      await fetchAllData();
      toast({ title: "Bon de livraison généré" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de génération', description: errorMessage });
    }
  }, [fetchAllData, toast]);

  const validerLivraison = useCallback(async (livraisonId: number) => {
    try {
      await api.validerLivraison(livraisonId);
      await fetchAllData(); // Refreshes both products and delivery notes
      toast({ title: "Livraison validée et stock mis à jour" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de validation', description: errorMessage });
    }
  }, [fetchAllData, toast]);

  const value = useMemo(() => ({
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient,
    deleteFacture, 
    createInventaire, addReapprovisionnement,
    createCommande, validerCommande, genererFacture, genererBonLivraison, validerLivraison,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, isAuthenticated: !!token, currentUser,
    login, logout,
    scannedProductDetails, setScannedProductDetails,
  }), [
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient, deleteFacture,
    createInventaire, addReapprovisionnement,
    createCommande, validerCommande, genererFacture, genererBonLivraison, validerLivraison,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, token, logout, currentUser, scannedProductDetails
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
