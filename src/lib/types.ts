export type Categorie = {
  id: string;
  nom: string;
};

export type Produit = {
  id: string;
  nom: string;
  code_barre: string;
  categorie_id: string;
  prix_achat: number;
  prix_vente: number;
  quantite_stock: number;
  unite: string;
  alerte_stock: number;
};

export type VenteLigne = {
  id: string;
  produit: Produit; // Garder l'objet produit complet est plus simple pour l'accès aux données
  quantite: number;
  prix_unitaire: number; // prix_vente au moment de la vente
  prix_total: number;
};

export type Vente = {
  id: string;
  client: string;
  lignes: VenteLigne[];
  montant_total: number;
  montant_paye: number;
  reste: number;
  type_paiement: 'cash' | 'flooz' | 'tmoney' | 'carte';
  vendeur: string; // Pour l'instant, un simple nom. Pourrait être lié à un utilisateur
  date_vente: Date;
  type: 'pos' | 'manual';
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
  id: string;
  nom: string;
  role: 'admin' | 'vendeur';
  identifiant: string;
  mot_de_passe_hash: string;
};
