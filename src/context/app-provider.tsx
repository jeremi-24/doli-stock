
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Produit, Categorie, LieuStock, AssignationPayload, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Client, ShopInfo, ThemeColors, CurrentUser, CommandePayload, Commande, Facture, BonLivraison, RoleCreationPayload, Permission } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';

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
  annulerCommande: (commandeId: number) => Promise<void>;
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
  login: (token: string, profile: any) => Promise<void>;
  logout: () => void;
  hasPermission: (action: string) => boolean;
  scannedProductDetails: any | null;
  setScannedProductDetails: (details: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialShopInfo: ShopInfo = { nom: 'StockHero', adresse: '123 Rue Principale', ville: 'Lomé', telephone: '+228 90 00 00 00', email: 'contact@stockhero.dev' };
const initialThemeColors: ThemeColors = { primary: '221 48% 48%', background: '220 13% 96%', accent: '262 52% 50%' };

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
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    setPermissions(new Set());
    localStorage.removeItem('stockhero_token');
    localStorage.removeItem('stockhero_user');
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
      if (error instanceof api.ApiError && (error.status === 403)) {
         // Don't show a toast for 403, as it's an expected access denial, not a system error
         console.warn(`Access denied for resource: ${resourceName}`);
      } else if (error instanceof api.ApiError && error.status === 401) {
        toast({ variant: 'destructive', title: 'Session expirée', description });
        setTimeout(() => logout(), 1500);
      } else {
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: `Impossible de charger: ${resourceName}.` });
      }
  }, [toast, logout]);
  
  const handleGenericError = useCallback((error: unknown, title: string = "Erreur") => {
    const description = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    if (error instanceof api.ApiError && error.status === 403) {
        toast({ variant: 'destructive', title: 'Accès refusé', description });
    } else if (error instanceof api.ApiError && error.status === 401) {
      setTimeout(() => logout(), 1500);
    } else {
      toast({ variant: 'destructive', title, description });
    }
    throw error;
  }, [toast, logout]);

  const fetchFactures = useCallback(async () => {
    try {
        const data = await api.getFactures();
        setFactures(data || []);
    } catch (error) {
        handleFetchError(error, 'Factures');
        // Still throw so Promise.allSettled can see it as rejected
        throw error;
    }
  }, [handleFetchError]);

  const fetchAllData = useCallback(async () => {
    const dataFetchPromises = [
        api.getOrganisations().then(orgs => {
            if (orgs && orgs.length > 0) setShopInfoState(orgs[0]);
        }).catch(err => handleFetchError(err, 'Organisation')),
        api.getProducts().then(data => setProduits(data || [])).catch(err => handleFetchError(err, 'Produits')),
        api.getCategories().then(data => setCategories(data || [])).catch(err => handleFetchError(err, 'Catégories')),
        api.getLieuxStock().then(data => setLieuxStock(data || [])).catch(err => handleFetchError(err, 'Lieux de Stock')),
        api.getClients().then(data => setClients(data || [])).catch(err => handleFetchError(err, 'Clients')),
        api.getCommandes().then(data => setCommandes(data || [])).catch(err => handleFetchError(err, 'Commandes')),
        fetchFactures(),
    ];

    try {
        const user = JSON.parse(localStorage.getItem('stockhero_user') || 'null');
        if (user && user.lieuId) {
            dataFetchPromises.push(
                api.getBonsLivraison(user.lieuId)
                    .then(data => setBonLivraisons(data || []))
                    .catch(err => handleFetchError(err, 'Bons de Livraison'))
            );
        } else {
            setBonLivraisons([]);
        }
    } catch (error) {
        handleFetchError(error, 'User Info for Deliveries');
    }

    await Promise.allSettled(dataFetchPromises);
  }, [handleFetchError, fetchFactures]);


  const updateUserFromStorage = useCallback(() => {
    const storedToken = localStorage.getItem('stockhero_token');
    const storedUser = localStorage.getItem('stockhero_user');
    if (storedToken && storedUser) {
        try {
            const user: CurrentUser = JSON.parse(storedUser);
            setCurrentUser(user);
            setToken(storedToken);
            const userPermissions = new Set(user.permissions?.filter(p => p.autorise).map(p => p.action) || []);
            setPermissions(userPermissions);
            return user;
        } catch (e) {
            console.error("Failed to parse user from storage", e);
            logout();
            return null;
        }
    }
    return null;
  }, [logout]);
  
  useEffect(() => {
    updateUserFromStorage();
    const storedThemeColors = localStorage.getItem('stockhero_themecolors');
    if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
    setIsMounted(true);
  }, [updateUserFromStorage]);

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

  const login = async (newToken: string, profile: CurrentUser | null) => {
    localStorage.setItem('stockhero_token', newToken);
    setToken(newToken);
    
    try {
        const userProfile = profile || await api.getUserProfile();
        localStorage.setItem('stockhero_user', JSON.stringify(userProfile));
        setCurrentUser(userProfile);
        const userPermissions = new Set(userProfile.permissions?.filter(p => p.autorise).map(p => p.action) || []);
        setPermissions(userPermissions);
    } catch (error) {
        handleGenericError(error, "Erreur de chargement du profil");
        logout(); // Logout if profile fetching fails
    }
  };
  
  const hasPermission = useCallback((action: string) => {
    if (currentUser?.role?.nom === 'ADMIN') {
        return true;
    }
    return permissions.has(action);
  }, [permissions, currentUser]);
  
  const setShopInfo = useCallback(async (orgData: ShopInfo) => {
    try {
        await api.saveOrganisation(orgData);
        await fetchAllData();
        toast({ title: "Informations de l'organisation mises à jour" });
    } catch (error) {
        handleGenericError(error, "Erreur de sauvegarde");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const addCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'nProd'>) => {
    try { await api.createCategory(data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [fetchAllData, handleGenericError]);
  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => {
    try { await api.updateCategory(id, data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [fetchAllData, handleGenericError]);
  const deleteCategories = useCallback(async (ids: number[]) => {
    try { await api.deleteCategories(ids); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [fetchAllData, handleGenericError]);

  const addLieuStock = useCallback(async (data: Omit<LieuStock, 'id'>) => {
    try { await api.createLieuStock(data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [fetchAllData, handleGenericError]);
  const updateLieuStock = useCallback(async (id: number, data: Partial<LieuStock>) => {
    try { await api.updateLieuStock(id, data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [fetchAllData, handleGenericError]);
  const deleteLieuxStock = useCallback(async (ids: number[]) => {
    try { await api.deleteLieuxStock(ids); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [fetchAllData, handleGenericError]);

  const addProduit = useCallback(async (data: Omit<Produit, 'id'>) => {
    try { await api.createProduct(data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [fetchAllData, handleGenericError]);
  const updateProduit = useCallback(async (data: Produit) => {
    try { await api.updateProduct(data.id, data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [fetchAllData, handleGenericError]);
  const deleteProduits = useCallback(async (ids: number[]) => {
    try { await api.deleteProducts(ids); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [fetchAllData, handleGenericError]);
  const assignProduits = useCallback(async (data: AssignationPayload) => {
    try { await api.assignProducts(data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur d'assignation"); }
  }, [fetchAllData, handleGenericError]);
  const addMultipleProduits = useCallback(async () => { await fetchAllData(); }, [fetchAllData]);
  
  const addClient = useCallback(async (data: Omit<Client, 'id'>) => {
    try { await api.createClient(data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [fetchAllData, handleGenericError]);
  const updateClient = useCallback(async (id: number, data: Partial<Client>) => {
    try { await api.updateClient(id, data); await fetchAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [fetchAllData, handleGenericError]);
  const deleteClient = useCallback(async (id: number) => {
    try {
        await api.deleteClient(id);
        await fetchAllData();
        toast({ title: "Client supprimé" });
    } catch(error) {
        handleGenericError(error, "Erreur de suppression");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const deleteFacture = useCallback(async (factureId: number) => {
    try {
        await api.deleteFacture(factureId);
        await fetchFactures();
        toast({ title: "Facture supprimée avec succès" });
    } catch (error) {
        handleGenericError(error, "Erreur de suppression");
    }
  }, [fetchFactures, toast, handleGenericError]);

  const createInventaire = useCallback(async (payload: InventairePayload, isFirst: boolean): Promise<Inventaire | null> => {
    try {
      const newInventaire = await api.createInventaire(payload, isFirst);
      await fetchAllData();
      toast({ title: "Inventaire enregistré avec succès" });
      return newInventaire;
    } catch (error) {
      handleGenericError(error, "Erreur d'enregistrement");
      return null;
    }
  }, [fetchAllData, toast, handleGenericError]);

  const addReapprovisionnement = useCallback(async (payload: ReapproPayload): Promise<Reapprovisionnement | null> => {
    try {
      const newReappro = await api.createReapprovisionnement(payload);
      await fetchAllData();
      toast({ title: "Réapprovisionnement enregistré avec succès" });
      return newReappro;
    } catch (error) {
      handleGenericError(error, "Erreur d'enregistrement");
      return null;
    }
  }, [fetchAllData, toast, handleGenericError]);

  const createCommande = useCallback(async (payload: CommandePayload): Promise<Commande | null> => {
    try {
      const newCommande = await api.createCommande(payload);
      await fetchAllData();
      toast({ title: "Commande créée avec succès" });
      return newCommande;
    } catch (error) {
        handleGenericError(error, "Erreur de création");
        return null;
    }
  }, [fetchAllData, toast, handleGenericError]);

  const validerCommande = useCallback(async (commandeId: number) => {
    try {
      await api.validerCommande(commandeId);
      await fetchAllData();
      toast({ title: "Commande validée" });
    } catch (error) {
        handleGenericError(error, "Erreur de validation");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const annulerCommande = useCallback(async (commandeId: number) => {
    try {
      await api.annulerCommande(commandeId);
      await fetchAllData();
      toast({ title: "Commande annulée" });
    } catch (error) {
        handleGenericError(error, "Erreur d'annulation");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const genererFacture = useCallback(async (commandeId: number) => {
    try {
      await api.genererFacture(commandeId);
      await fetchFactures();
      toast({ title: "Facture générée" });
    } catch (error) {
        handleGenericError(error, "Erreur de génération");
    }
  }, [fetchFactures, toast, handleGenericError]);

  const genererBonLivraison = useCallback(async (commandeId: number) => {
    try {
      await api.genererBonLivraison(commandeId);
      await fetchAllData();
      toast({ title: "Bon de livraison généré" });
    } catch (error) {
        handleGenericError(error, "Erreur de génération");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const validerLivraison = useCallback(async (livraisonId: number) => {
    try {
      await api.validerLivraison(livraisonId);
      await fetchAllData(); // Refreshes both products and delivery notes
      toast({ title: "Livraison validée et stock mis à jour" });
    } catch (error) {
        handleGenericError(error, "Erreur de validation");
    }
  }, [fetchAllData, toast, handleGenericError]);

  const value = useMemo(() => ({
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient,
    deleteFacture, 
    createInventaire, addReapprovisionnement,
    createCommande, validerCommande, annulerCommande, genererFacture, genererBonLivraison, validerLivraison,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, isAuthenticated: !!token, currentUser,
    login, logout, hasPermission,
    scannedProductDetails, setScannedProductDetails,
  }), [
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient, deleteFacture,
    createInventaire, addReapprovisionnement,
    createCommande, validerCommande, annulerCommande, genererFacture, genererBonLivraison, validerLivraison,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, token, logout, currentUser, scannedProductDetails, hasPermission, login
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

    
