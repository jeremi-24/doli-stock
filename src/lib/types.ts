

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
  qteMin: number;
  prix: number;
  codeBarre: string;
  categorieId: number;
  lieuStockId: number;
  categorieNom?: string | null;
  lieuStockNom?: string | null;
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
  qteScanne: number;
  qteAvantScan: number;
  ecart: number;
  lieuStockNom: string;
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
};
export type InventaireProduitPayload = {
    produitId: number;
    qteScanne: number;
    lieuStockNom: string;
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
  qteAjoutee: number;
  lieuStockNom: string;
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
};
export type ReapproPayloadLigne = {
    produitId: number;
    qteAjoutee: number;
    lieuStockNom: string;
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
};

export type BonLivraison = {
    id: number;
    dateLivraison: string;
    commandeId: number;
    lignes: LigneBonLivraison[];
    statut: 'EN_ATTENTE_LIVRAISON' | 'LIVREE';
};

export type ValidationCommandeResponse = {
  commande: Commande;
  facture: Facture;
  bonLivraison: BonLivraison;
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
  lieuId?: number;
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
}
