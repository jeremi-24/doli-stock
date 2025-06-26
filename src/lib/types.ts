export type Categorie = {
  id: number;
  nom: string;
  nProd?: number;
};

export type Entrepot = {
  id: number;
  nom: string;
  ref: string;
  quantite?: number;
  valeurVente?: number;
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
  entrepotId: number;
};

export type VenteLigne = {
  id: number;
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
};

export type Vente = {
  id: number;
  client: string;
  lignes: VenteLigne[];
  montant_total: number;
  montant_paye: number;
  reste: number;
  type_paiement: 'cash' | 'flooz' | 'tmoney' | 'carte';
  vendeur: string;
  date_vente: Date;
  type: 'pos' | 'manual';
  facture_modele_id?: string;
};

export type FactureModele = {
  id: string;
  nom: string;
  logoUrl?: string;
  headerContent?: string;
  footerContent?: string;
  primaryColor?: string;
};

export type AssignationPayload = {
    produitIds: number[];
    categorieId?: number;
    entrepotId?: number;
};


// ----- App Settings Types (unchanged) -----

export type ActiveModules = {
  stock: boolean;
  invoicing: boolean;
  barcode: boolean;
  pos: boolean;
};

export type ShopInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

export type ThemeColors = {
    primary: string;
    background: string;
    accent: string;
};

export type Utilisateur = {
  id: number;
  nom: string;
  role: 'admin' | 'vendeur';
  identifiant: string;
  mot_de_passe_hash: string;
};
