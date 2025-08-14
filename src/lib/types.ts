
export type Client = {
  id: number;
  nom: string;
  tel: string;
};

export type Categorie = {
  id: number;
  nom: string;
  nProd?: number;
};



export type Produit = {
  id: number;
  nom:string;
  ref: string;
  prix: number;
  codeBarre: string;
  categorieId: number;
  qteMin: number;
  qteParCarton: number;
  prixCarton: number;
  categorieNom?: string | null;
  quantiteTotaleGlobale?: number;
  stocks?: Stock[];
};

export type Stock = {
    id: number;
    produitId: number;
    produitNom: string;
    lieuStockId: number;
    lieuStockNom: string;
    qteCartons: number;
    qteUnitesRestantes: number;
    quantiteTotale: number;
    produit?: Produit;
};


export type AssignationPayload = {
    produitIds: number[];
    categorieId?: number;
};

// ----- Barcode Types -----
export type BarcodePrintRequest = {
  produitId: number;
  quantite: number;
};

// ----- Inventory Types -----
export type InventaireStatus = 'CONFIRME' | 'EN_ATTENTE_CONFIRMATION';

export type InventaireLigne = {
    produitId: number;
    ref: string;
    nomProduit: string;
    lieuStockNom: string;
    qteAvantScanTotaleUnites: number;
    qteScanneTotaleUnites: number;
    ecartTotalUnites: number;
    typeQuantiteScanne: 'UNITE' | 'CARTON';
    qteAvantScanCartons: number;
    qteAvantScanUnitesRestantes: number;
    qteScanneCartons: number;
    qteScanneUnitesRestantes: number;
    ecartCartons: number;
    ecartUnites: number;
};
export type Inventaire = {
  id: number;
  charge: string;
  date: string;
  lignes: InventaireLigne[];
  statut: InventaireStatus;
};
export type ScannedProduit = {
  produitId: number;
  nomProduit: string;
  refProduit: string;
  qteScanne: number;
  lieuStockNom: string;
  barcode: string;
  typeQuantiteScanne: 'UNITE' | 'CARTON';
};

export type InventaireLignePayload = {
  produitId: number;
  qteScanne: number;
  lieuStockId: number;
  typeQuantiteScanne: string;
  ref: string;
};

export type InventairePayload = {
  charge: string;
  lieuStockId: number;
  produits: InventaireLignePayload[];
};

// ----- Restocking Types -----
export type ReapproLigne = {
  id: number;
  produitId: number;
  produitNom: string;
  qteAjouteeDansLigne: number;
  typeQuantite: string;
  lieuStockNom: string;
  qteAjouteeCartons: number;
  qteAjouteeUnites: number;
  qteAjouteeTotaleUnites: number;
};
export type Reapprovisionnement = {
  id: number;
  source: string;
  agent: string;
  date: string;
  lignes: ReapproLigne[];
};
export type ScannedReapproProduit = {
  produitId: number;
  nomProduit: string;
  qteAjoutee: number;
  lieuStockNom: string;
  barcode: string;
  typeQuantite: 'UNITE' | 'CARTON';
};
export type ReapproPayloadLigne = {
    produitId: number;
    qteAjoutee: number;
    typeQuantite: 'UNITE' | 'CARTON';
};
export type ReapproPayload = {
  source: string;
  agent: string;
  lignes: ReapproPayloadLigne[];
};


// ----- Commande, Facture, Livraison Types -----

export type LigneCommande = {
  id: number;
  produitNom: string;
  produitRef: string;
  qteVoulu: number;
  produitPrix: number;
  totalLigne: number;
};

export type CommandeStatus = 'EN_ATTENTE' | 'VALIDEE' | 'ANNULEE' | 'LIVREE';

export type Commande = {
  id: number;
  date: string;
  statut: CommandeStatus;
  client: Client;
  lieuLivraison: LieuStock | null;
  lignes: LigneCommande[];
  totalCommande: number;
  statutBonLivraison: string;
};

export type LigneFacture = {
  id: number;
  produitNom: string;
  produitRef: string;
  qteVoulu: number;
  produitPrix: number;
  totalLigne: number;
};

export type Facture = {
    idFacture: number;
    dateFacture: string;
    commandeId: number;
    clientNom: string;
    montantTotal: number;
    lignes: LigneFacture[];
};

export type LigneBonLivraison = {
    id: number;
    produitId: number;
    produitNom: string;
    produitPrix: number;
    qteLivreeDansLigne: number;
    typeQuantite: string | null;
    qteLivreeCartons: number;
    qteLivreeUnites: number;
    qteLivreeTotaleUnites: number;
    totalLivraison: number;
};

export type BonLivraisonStatus = 'EN_ATTENTE' | 'A_LIVRER' | 'LIVRE' | 'VALIDE_SECRETARIAT';

export type BonLivraison = {
    id: number;
    dateLivraison: string;
    commandeId: number;
    agent: string; // This might be deprecated, API sends `email`
    email: string | null; // Agent's email
    lignesLivraison: LigneBonLivraison[];
    status: BonLivraisonStatus;
    lieuStock: LieuStock | null;
    totalLivraison: number;
};

export type LieuStock = {
id:number;
nom:string;
type?: string;
localisation?: string;

}

// --- Payloads for creating new entities
export type LigneCommandePayload = {
  produitId: number;
  qteVoulu: number;
};

export type CommandePayload = {
  clientId: number;
  lieuLivraisonId: number;
  lignes: LigneCommandePayload[];
};

// ----- POS Sale Types -----
export type VenteLigne = {
    id: number;
    produitId: number;
    produitNom: string;
    produitPrix: number;
    qteVendueDansLigne: number;
    typeQuantite: string;
    qteVendueCartons: number;
    qteVendueUnites: number;
    qteVendueTotaleUnites: number;
    total: number;
};

export type Vente = {
    id: number;
    date: string;
    ref: string;
    caissier: string;
    client: Client | null;
    lignes: VenteLigne[];
    total: number;
    statut?: 'COMPLETEE' | 'ANNULEE';
};

export type VenteDirecteLignePayload = {
    codeProduit: string;
    qteVendueDansLigne: number;
    typeQuantite: 'UNITE' | 'CARTON';
};
export type VenteDirectePayload = {
    clientId: number;
    lignes: VenteDirecteLignePayload[];
}


// ----- App Settings Types -----
export type ShopInfo = {
  id?: number;
  nom: string;
  logoUrl?: string;
  adresse?: string;
  ville?: string;
  numero?: string;
  telephone?: string;
  email?: string;
};

export type ThemeColors = {
    primary: string;
    background: string;
    accent: string;
};

export type Utilisateur = {
  id: number;
  email: string;
  roleId: number;
  roleNom: string;
  lieuId: number;
  lieuNom: string;
  permissions: Permission[];
};

export type Permission = {
    id: number;
    action: string;
    autorise: boolean;
};

export type Role = {
    id: number;
    nom: string;
    permissions?: Permission[];
}

export type RoleCreationPayload = {
    nom: string;
    permissions: {
        action: string;
        autorise: boolean;
    }[];
}

export type CurrentUser = {
  id: number;
  email: string;
  role: Role;
  roleNom: string;
  lieuId?: number;
  clientId?: number;
  permissions: Permission[];
  lieuNom?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
}

export type SignupPayload = {
  email: string;
  password: string;
  confirmPassword?: string;
  roleId: number;
  lieuId?: number;
}

// ----- Notifications -----
export interface Notification {
  id?: number;
  type?: string;
  message?: string;
  userId?: number;
  date?: string;
  lu?: boolean;
  commandeId?: number;
  statut?: string;
}

export type FactureModele = {
  id: string;
  nom: string;
  logoUrl?: string;
  header?: string;
  footer?: string;
  color?: string;
};
