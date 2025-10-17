

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
    produitRef: string;
    lieuStockId: number;
    lieuStockNom: string;
    qteCartons: number;
    qteUnitesRestantes: number;
    quantiteTotale: number;
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
  lieuStockId: number;
};
export type ScannedInventaireProduit = {
  produitId: number;
  nomProduit: string;
  ref: string;
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
  qteAjoutee: number;
  typeQuantite: string;
  lieuStockId: number;
};
export type Reapprovisionnement = {
  id: number;
  agent: string;
  date: string;
  lignes: ReapproLigne[];
  lieuStockId: number;
  lieuStockNom: string;
};
export type ScannedReapproProduit = {
  produitId: number;
  nomProduit: string;
  ref: string;
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
  agent: string;
  lieuStockId: number;
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
  prixPersonnalise?: number;
};

export type CommandePayload = {
  clientId: number;
  lieuStockId: number;
  lignes: LigneCommandePayload[];
};

// ----- POS Sale Types -----
export enum TypePaiement {
    COMPTANT = 'COMPTANT',
    CREDIT = 'CREDIT'
}

export enum EtatVente {
    SOLDEE = 'SOLDEE',
    EN_ATTENTE = 'EN_ATTENTE',
    ANNULEE = 'ANNULEE'
}

export enum ModePaiement {
    ESPECE = 'ESPECE',
    MOBILE_MONEY = 'MOBILE_MONEY',
    CHEQUE = 'CHEQUE',
    VIREMENT = 'VIREMENT'
}

export type Paiement = {
    id: number;
    venteId: number;
    venteRef: string;
    montant: number;
    modePaiement: ModePaiement;
    reference: string;
    datePaiement: string;
    caissier: string;
};

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
    codeProduit: string;
    lieuStockId: number;
};

export type Vente = {
    id: number;
    date: string;
    ref: string;
    caissier: string;
    client: Client | null;
    lignes: VenteLigne[];
    total: number;
    typePaiement: TypePaiement;
    montantPaye: number;
    soldeRestant: number;
    etat: EtatVente;
    lieuStockId: number;
    lieuStockNom: string;
    paiements: Paiement[];
    statut: EtatVente;
};

export type PaiementInitialPayload = {
    montant: number;
    modePaiement: ModePaiement;
    reference?: string;
};

export type VenteLignePayload = {
    codeProduit: string;
    qteVendueDansLigne: number;
    typeQuantite: 'UNITE' | 'CARTON';
};

export type VentePayload = {
    caissier: string;
    lieuStockId: number;
    clientId: number;
    typePaiement: TypePaiement;
    lignes: VenteLignePayload[];
    paiementInitial?: PaiementInitialPayload;
};

export type PaiementPayload = {
    venteId: number;
    montant: number;
    modePaiement: ModePaiement;
    reference?: string;
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
  lieuStockId?: number;
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

// ----- Logs -----
export type Log = {
  id: number;
  userId: number;
  email: string;
  action: string;
  date: string;
};
