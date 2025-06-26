export type Categorie = {
  id: number;
  nom: string;
  nbProduits?: number;
};

export type Produit = {
  id: number;
  nom:string;
  code_barre: string;
  categorieId: number;
  prix_vente: number;
  quantite_stock: number;
  alerte_stock: number;
  ref?: string;
  entrepotId?: number;
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
