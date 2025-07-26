

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

export type LieuStock = {
  id: number;
  nom: string;
  type: string;
  localisation?: string;
};

export type Produit = {
  id: number;
  nom:string;
  ref: string;
  qte: number;
  prix: number;
  codeBarre: string;
  categorieId: number;
  lieuStockId: number;
  qteMin: number;
  qteParCarton: number;
  prixCarton: number;
  categorieNom?: string | null;
  lieuStockNom?: string | null;
  quantiteTotaleGlobale?: number;
};

export type Stock = {
    id: number;
    produitNom: string;
    lieuStockNom: string;
    qteCartons: number;
    qteUnitesRestantes: number;
};


export type AssignationPayload = {
    produitIds: number[];
    categorieId?: number;
    lieuStockId?: number;
};

// ----- Inventory Types -----
export type InventaireLigne = {
    produitId: number;
    nomProduit: string;
    lieuStockNom: string;
    qteAvantScanTotaleUnites: number;
    qteScanneTotaleUnites: number;
    ecartTotalUnites: number;
    typeQuantiteScanne: string;
    qteAvantScanCartons: number;
    qteAvantScanUnitesRestantes: number;
    qteScanneCartons: number;
    qteScanneUnitesRestantes: number;
    ecartCartons: number;
    ecartUnites: number;
};
export type Inventaire = {
  inventaireId: number;
  charge: string;
  date: string;
  lignes: InventaireLigne[];
};
export type ScannedProduit = {
  produitId: number;
  nomProduit: string;
  qteScanne: number;
  lieuStockNom: string;
  barcode: string;
  typeQuantiteScanne: 'UNITE' | 'CARTON';
};
export type InventaireProduitPayload = {
    produitId: number;
    qteScanne: number;
    lieuStockNom: string;
    typeQuantiteScanne: 'UNITE' | 'CARTON';
};
export type InventairePayload = {
  charge: string;
  produits: InventaireProduitPayload[];
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

export type Commande = {
  id: number;
  date: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'ANNULEE' | 'LIVREE';
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
    produitNom: string;
    qteLivre: number;
    produitPrix: number;
    totalLigne: number;
};

export type BonLivraisonStatus = 'EN_ATTENTE' | 'A_LIVRER' | 'LIVRE' | 'VALIDE_SECRETARIAT';

export type BonLivraison = {
    id: number;
    dateLivraison: string;
    commandeId: number;
    agent: string;
    lignesLivraison: LigneBonLivraison[];
    status: BonLivraisonStatus;
    lieuStockNom: string;
};


// --- Payloads for creating new entities
export type LigneCommandePayload = {
  produitId: number;
  qteVoulu: number;
};

export type CommandePayload = {
  clientId: number;
  lignes: LigneCommandePayload[];
};

// ----- POS Sale Types -----
export type VenteDirecteLignePayload = {
    produitId: number;
    quantite: number;
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
