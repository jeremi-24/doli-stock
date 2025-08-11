

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Produit, Categorie, LieuStock, AssignationPayload, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Client, ShopInfo, ThemeColors, CurrentUser, CommandePayload, Commande, Facture, BonLivraison, RoleCreationPayload, Permission, LigneBonLivraison, VenteDirectePayload, Vente, CommandeStatus, Notification, FactureModele } from '@/lib/types';
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
  createInventaire: (payload: InventairePayload, premier: boolean) => Promise<Inventaire | null>;
  updateInventaire: (id: number, payload: InventairePayload) => Promise<Inventaire | null>;
  confirmInventaire: (id: number, premier: boolean) => Promise<Inventaire | null>;
  addReapprovisionnement: (payload: ReapproPayload) => Promise<Reapprovisionnement | null>;
  createCommande: (payload: CommandePayload) => Promise<Commande | null>;
  createVente: (payload: VenteDirectePayload) => Promise<Vente | null>;
  annulerVente: (venteId: number) => Promise<void>;
  validerCommande: (commandeId: number) => Promise<Commande | null>;
  annulerCommande: (commandeId: number) => Promise<void>;
  genererFacture: (commandeId: number) => Promise<void>;
  genererBonLivraison: (commandeId: number) => Promise<void>;
  validerLivraisonEtape1: (livraisonId: number) => Promise<void>;
  validerLivraisonEtape2: (livraisonId: number) => Promise<void>;
  refreshAllData: () => Promise<void>;
  shopInfo: ShopInfo;
  setShopInfo: (org: ShopInfo) => Promise<void>;
  themeColors: ThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<ThemeColors>>;
  isMounted: boolean;
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  hasPermission: (action: string) => boolean;
  scannedProductDetails: any | null;
  setScannedProductDetails: (details: any | null) => void;
  factureModeles: FactureModele[];
  addFactureModele: (modele: Omit<FactureModele, 'id'>) => Promise<void>;
  updateFactureModele: (modele: FactureModele) => Promise<void>;
  deleteFactureModele: (id: string) => Promise<void>;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialShopInfo: ShopInfo = { nom: 'STA', adresse: '123 Rue Principale', ville: 'Lomé', telephone: '+228 90 00 00 00', email: 'contact@stockhero.dev' };
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
  const [factureModeles, setFactureModeles] = useState<FactureModele[]>([]);
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
    router.push('/login');
    setIsMounted(true); 
  }, [router]);
  
  const handleGenericError = useCallback((error: unknown, title: string = "Erreur") => {
    const description = error instanceof api.ApiError ? error.message : (error instanceof Error ? error.message : "Une erreur inconnue est survenue.");
    if (error instanceof api.ApiError && error.status === 401) {
      setTimeout(() => logout(), 1500);
    }
    toast({ variant: 'destructive', title, description });
    throw error;
  }, [toast, logout]);

  const handleFetchError = useCallback((error: unknown, resourceName: string) => {
      const description = error instanceof Error ? error.message : `Erreur inconnue lors du chargement: ${resourceName}`;
      if (error instanceof api.ApiError && (error.status === 401 || error.status === 403)) {
        if (error.status === 401) {
            toast({ variant: 'destructive', title: 'Session expirée', description: 'Veuillez vous reconnecter.' });
            setTimeout(() => logout(), 1500);
        } else {
            handleGenericError(error, `Accès refusé: ${resourceName}`);
        }
      } else {
        handleGenericError(error, `Erreur: ${resourceName}`);
      }
  }, [toast, logout, handleGenericError]);
  
  const fetchFactures = useCallback(async () => {
    try {
        const data = await api.getFactures();
        setFactures(data || []);
    } catch (error) {
        handleFetchError(error, 'Factures');
    }
  }, [handleFetchError]);

  const refreshAllData = useCallback(async () => {
    if (!currentUser) return;
    
    const adminOrControlRoles = ['ADMIN', 'SECRETARIAT', 'DG', 'CONTROLLEUR'];

    let fetchCommandesPromise;
    if (adminOrControlRoles.includes(currentUser.roleNom)) {
        fetchCommandesPromise = api.getCommandes().then(data => setCommandes(data || [])).catch(err => handleFetchError(err, 'Toutes les Commandes'));
    } else if (currentUser.clientId) {
        fetchCommandesPromise = api.getCommandesByClientId(currentUser.clientId).then(data => setCommandes(data || [])).catch(err => handleFetchError(err, 'Commandes Client'));
    }

    let fetchLivraisonsPromise;
    if (adminOrControlRoles.includes(currentUser.roleNom)) {
        fetchLivraisonsPromise = api.getAllBonsLivraison().then(data => setBonLivraisons(data || [])).catch(err => handleFetchError(err, 'Tous les Bons de Livraison'));
    } else {
        fetchLivraisonsPromise = api.getBonsLivraisonParLieu().then(data => setBonLivraisons(data || [])).catch(err => handleFetchError(err, 'Bons de Livraison par Lieu'));
    }

    let fetchClientsPromise;
    if (adminOrControlRoles.includes(currentUser.roleNom)) {
        fetchClientsPromise = api.getAllClients().then(data => setClients(data || [])).catch(err => handleFetchError(err, 'Tous les clients'));
    } else {
        fetchClientsPromise = api.getClients().then(data => setClients(data || [])).catch(err => handleFetchError(err, 'Clients'));
    }
    
    const dataFetchPromises = [
      api.getOrganisations().then(orgs => {
          if (orgs && orgs.length > 0) setShopInfoState(orgs[0]);
      }).catch(err => handleFetchError(err, 'Organisation')),
      api.getProducts().then(data => setProduits(data || [])).catch(err => handleFetchError(err, 'Produits')),
      api.getCategories().then(data => setCategories(data || [])).catch(err => handleFetchError(err, 'Catégories')),
      api.getLieuxStock().then(data => setLieuxStock(data || [])).catch(err => handleFetchError(err, 'Lieux de Stock')),
      fetchClientsPromise,
      fetchCommandesPromise,
      fetchLivraisonsPromise,
      fetchFactures(),
    ];

    await Promise.allSettled(dataFetchPromises);
  }, [handleFetchError, fetchFactures, currentUser]);


  const loadUserAndData = useCallback(async (token: string): Promise<boolean> => {
    try {
      const userProfile = await api.getMe();
      setCurrentUser(userProfile);
      const userPermissions = new Set(userProfile.permissions?.filter(p => p.autorise).map(p => p.action) || []);
      setPermissions(userPermissions);
      return true;
    } catch (error) {
      handleGenericError(error, "Erreur de chargement de la session");
      logout();
      return false;
    }
  }, [handleGenericError, logout]);

  useEffect(() => {
    const initializeApp = async () => {
      const storedThemeColors = localStorage.getItem('stockhero_themecolors');
      if (storedThemeColors) setThemeColors(JSON.parse(storedThemeColors));
      
      const storedToken = localStorage.getItem('stockhero_token');
      if (storedToken) {
        setToken(storedToken);
        await loadUserAndData(storedToken);
      }
      
      setIsMounted(true);
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('stockhero_themecolors', JSON.stringify(themeColors));
      const root = document.documentElement;
      if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
      if (themeColors.background) root.style.setProperty('--background', themeColors.background);
      if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
    }
  }, [themeColors, isMounted]);

  const login = async (newToken: string) => {
    setIsMounted(false);
    localStorage.setItem('stockhero_token', newToken);
    setToken(newToken);
    await loadUserAndData(newToken);
    setIsMounted(true);
  };
  
  const hasPermission = useCallback((action: string) => {
    if (!currentUser || !isMounted) return false;
    if (currentUser.roleNom === 'ADMIN') return true;
    return permissions.has(action);
  }, [permissions, currentUser, isMounted]);
  
  const setShopInfo = useCallback(async (orgData: ShopInfo) => {
    try {
        await api.saveOrganisation(orgData);
        await refreshAllData();
        toast({ title: "Informations de l'organisation mises à jour" });
    } catch (error) {
        handleGenericError(error, "Erreur de sauvegarde");
    }
  }, [refreshAllData, toast, handleGenericError]);

  const addCategorie = useCallback(async (data: Omit<Categorie, 'id' | 'nProd'>) => {
    try { await api.createCategory(data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [refreshAllData, handleGenericError]);
  const updateCategorie = useCallback(async (id: number, data: Partial<Categorie>) => {
    try { await api.updateCategory(id, data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [refreshAllData, handleGenericError]);
  const deleteCategories = useCallback(async (ids: number[]) => {
    try { await api.deleteCategories(ids); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [refreshAllData, handleGenericError]);

  const addLieuStock = useCallback(async (data: Omit<LieuStock, 'id'>) => {
    try { await api.createLieuStock(data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [refreshAllData, handleGenericError]);
  const updateLieuStock = useCallback(async (id: number, data: Partial<LieuStock>) => {
    try { await api.updateLieuStock(id, data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [refreshAllData, handleGenericError]);
  const deleteLieuxStock = useCallback(async (ids: number[]) => {
    try { await api.deleteLieuxStock(ids); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [refreshAllData, handleGenericError]);

  const addProduit = useCallback(async (data: Omit<Produit, 'id'>) => {
    try { await api.createProduct(data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [refreshAllData, handleGenericError]);
  const updateProduit = useCallback(async (data: Produit) => {
    try { await api.updateProduct(data.id, data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [refreshAllData, handleGenericError]);
  const deleteProduits = useCallback(async (ids: number[]) => {
    try { await api.deleteProducts(ids); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
  }, [refreshAllData, handleGenericError]);
  const assignProduits = useCallback(async (data: AssignationPayload) => {
    try { await api.assignProducts(data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur d'assignation"); }
  }, [refreshAllData, handleGenericError]);
  const addMultipleProduits = useCallback(async () => { await refreshAllData(); }, [refreshAllData]);
  
  const addClient = useCallback(async (data: Omit<Client, 'id'>) => {
    try { await api.createClient(data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
  }, [refreshAllData, handleGenericError]);
  const updateClient = useCallback(async (id: number, data: Partial<Client>) => {
    try { await api.updateClient(id, data); await refreshAllData(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
  }, [refreshAllData, handleGenericError]);
  const deleteClient = useCallback(async (id: number) => {
    try {
        await api.deleteClient(id);
        await refreshAllData();
        toast({ title: "Client supprimé" });
    } catch(error) {
        handleGenericError(error, "Erreur de suppression");
    }
  }, [refreshAllData, toast, handleGenericError]);

  const deleteFacture = useCallback(async (factureId: number) => {
    try {
        await api.deleteFacture(factureId);
        await fetchFactures();
        toast({ title: "Facture supprimée avec succès" });
    } catch (error) {
        handleGenericError(error, "Erreur de suppression");
    }
  }, [fetchFactures, toast, handleGenericError]);

  const createInventaire = useCallback(async (payload: InventairePayload, premier: boolean): Promise<Inventaire | null> => {
    try {
      const calculatedInventaire = await api.calculateInventaire(payload, premier);
      await refreshAllData();
      toast({ title: "Calcul des écarts terminé" });
      return calculatedInventaire;
    } catch (error) {
      handleGenericError(error, "Erreur de calcul d'inventaire");
      return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const updateInventaire = useCallback(async (id: number, payload: InventairePayload): Promise<Inventaire | null> => {
    try {
      const recalculatedInventaire = await api.recalculateInventaire(id, payload);
      await refreshAllData();
      toast({ title: "Recalcul des écarts terminé" });
      return recalculatedInventaire;
    } catch (error) {
      handleGenericError(error, "Erreur de recalcul d'inventaire");
      return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const confirmInventaire = useCallback(async (id: number, premier: boolean): Promise<Inventaire | null> => {
    try {
      const confirmedInventaire = await api.confirmInventaire(id, premier);
      await refreshAllData();
      toast({ title: "Inventaire confirmé et appliqué au stock !" });
      return confirmedInventaire;
    } catch (error) {
      handleGenericError(error, "Erreur de confirmation d'inventaire");
      return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const addReapprovisionnement = useCallback(async (payload: ReapproPayload): Promise<Reapprovisionnement | null> => {
    try {
      const newReappro = await api.createReapprovisionnement(payload);
      await refreshAllData();
      toast({ title: "Réapprovisionnement enregistré avec succès" });
      return newReappro;
    } catch (error) {
      handleGenericError(error, "Erreur d'enregistrement");
      return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const createCommande = useCallback(async (payload: CommandePayload): Promise<Commande | null> => {
    try {
      const newCommande = await api.createCommande(payload);
      await refreshAllData();
      toast({ title: "Commande créée avec succès" });
      return newCommande;
    } catch (error) {
        handleGenericError(error, "Erreur de création");
        return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const createVente = useCallback(async (payload: VenteDirectePayload): Promise<Vente | null> => {
    try {
      const newVente = await api.createVenteDirecte(payload);
      await refreshAllData();
      toast({ title: "Vente finalisée !", description: `Le stock a été mis à jour.`});
      return newVente;
    } catch (error) {
         handleGenericError(error, 'Erreur de vente');
         return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const annulerVente = useCallback(async (venteId: number) => {
    try {
      await api.annulerVente(venteId);
      await refreshAllData();
      toast({ title: "Vente annulée", description: "Le stock a été restauré." });
    } catch (error) {
        handleGenericError(error, "Erreur d'annulation de la vente");
    }
  }, [refreshAllData, toast, handleGenericError]);

  const validerCommande = useCallback(async (commandeId: number): Promise<Commande | null> => {
    try {
      const validationData = await api.validerCommande(commandeId);
      await refreshAllData();
      toast({ title: "Commande validée" });
      return validationData;
    } catch (error) {
        handleGenericError(error, "Erreur de validation");
        return null;
    }
  }, [refreshAllData, toast, handleGenericError]);

  const annulerCommande = useCallback(async (commandeId: number) => {
    try {
      await api.annulerCommande(commandeId);
      await refreshAllData();
      toast({ title: "Commande annulée" });
    } catch (error) {
        handleGenericError(error, "Erreur d'annulation");
    }
  }, [refreshAllData, toast, handleGenericError]);

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
      await refreshAllData();
      toast({ title: "Bon de livraison généré" });
    } catch (error) {
        handleGenericError(error, "Erreur de génération");
    }
  }, [refreshAllData, toast, handleGenericError]);

 const validerLivraisonEtape1 = useCallback(async (livraisonId: number) => {
    try {
      await api.validerLivraisonEtape1(livraisonId);
      await refreshAllData();
      toast({ title: "Bon de livraison validé" });
    } catch (error) {
        handleGenericError(error, "Erreur de validation (Étape 1)");
    }
  }, [refreshAllData, toast, handleGenericError]);

  const validerLivraisonEtape2 = useCallback(async (livraisonId: number) => {
    try {
      await api.validerLivraisonEtape2(livraisonId);
      await refreshAllData();
      toast({ title: "Livraison confirmée et stock mis à jour" });
    } catch (error) {
        handleGenericError(error, "Erreur de validation (Étape 2)");
    }
  }, [refreshAllData, toast, handleGenericError]);
  
  const addFactureModele = useCallback(async (data: Omit<FactureModele, 'id'>) => {
    // try { await api.addFactureModele(data); await fetchFactureModeles(); } catch (error) { handleGenericError(error, "Erreur d'ajout"); }
    await Promise.resolve();
  }, [handleGenericError]);
  const updateFactureModele = useCallback(async (data: FactureModele) => {
    // try { await api.updateFactureModele(data); await fetchFactureModeles(); } catch (error) { handleGenericError(error, "Erreur de mise à jour"); }
    await Promise.resolve();
  }, [handleGenericError]);
  const deleteFactureModele = useCallback(async (id: string) => {
    // try { await api.deleteFactureModele(id); await fetchFactureModeles(); } catch (error) { handleGenericError(error, "Erreur de suppression"); }
    await Promise.resolve();
  }, [handleGenericError]);


  const value = useMemo(() => ({
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, factureModeles, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient, deleteFacture,
    createInventaire, updateInventaire, confirmInventaire, addReapprovisionnement,
    createCommande, createVente, annulerVente, validerCommande, annulerCommande, genererFacture, genererBonLivraison, 
    validerLivraisonEtape1, validerLivraisonEtape2, refreshAllData,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, isAuthenticated: !!token, currentUser,
    login, logout, hasPermission,
    scannedProductDetails, setScannedProductDetails,
    addFactureModele, updateFactureModele, deleteFactureModele,
  }), [
    produits, categories, lieuxStock, clients, factures, commandes, bonLivraisons, factureModeles, fetchFactures,
    addProduit, updateProduit, deleteProduits, addMultipleProduits, assignProduits,
    addCategorie, updateCategorie, deleteCategories,
    addLieuStock, updateLieuStock, deleteLieuxStock,
    addClient, updateClient, deleteClient, deleteFacture,
    createInventaire, updateInventaire, confirmInventaire, addReapprovisionnement,
    createCommande, createVente, annulerVente, validerCommande, annulerCommande, genererFacture, genererBonLivraison, 
    validerLivraisonEtape1, validerLivraisonEtape2, refreshAllData,
    shopInfo, setShopInfo, themeColors, setThemeColors,
    isMounted, token, currentUser, scannedProductDetails, hasPermission, login, logout,
    addFactureModele, updateFactureModele, deleteFactureModele,
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
