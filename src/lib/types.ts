

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
  // These can be returned from specific API calls
  categorieNom?: string | null;
  lieuStockNom?: string | null;
};

// This type is used for the local cart state in the UI
export type VenteLigne = {
  id: number;
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
};

// --- API Types for Sales ---

// Represents a line item in a sale, as returned by the GET /api/ventes endpoint
export type VenteLigneApi = {
    id: number;
    produitId: number;
    qteVendu: number;
    produitPrix: number;
    total: number;
    vente?: string;
    // This property is added on the client-side for display purposes
    produitNom?: string;
};

// Represents a sale, as returned by the GET /api/ventes endpoint
export type Vente = {
    id: number;
    ref: string;
    date: string; 
    caissier: string;
    client: string;
    paiement: number; // This is the total amount
    lignes: VenteLigneApi[];
};

// --- Payload Types for Creating a new Sale ---

// Represents a line item in the payload for POST /api/ventes
export type VentePayloadLigne = {
    produitId: number;
    produitNom: string;
    qteVendu: number;
    produitPrix: number;
    total: number;
};

// Represents the payload for POST /api/ventes
export type VentePayload = {
    ref: string;
    caissier: string;
    clientId: number;
    lignes: VentePayloadLigne[];
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


// ----- App Settings Types -----

export type ActiveModules = {
  stock: boolean;
  invoicing: boolean;
  barcode: boolean;
  pos: boolean;
};

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
  roleNom: string;
  lieuNom: string;
};

export type Role = {
    id: number;
    nom: string;
}

export type CurrentUser = {
  email: string;
  role: string;
};

export type LoginPayload = {
  email: string;
  password: string;
}

export type SignupPayload = {
  email: string;
  password: string;
  confirmPassword?: string;
  role: 'ADMIN' | 'USER';
}

    