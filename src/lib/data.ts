import type { Produit, Categorie, FactureModele } from './types';

/**
 * Liste des catégories de produits disponibles
 */
export const sampleCategories: Categorie[] = [
  { id: 1, nom: 'Boissons' },
  { id: 2, nom: 'Alimentation' },
  { id: 3, nom: 'Textile' },
  { id: 4, nom: 'Hygiène' },
  { id: 5, nom: 'Services' },
  { id: 6, nom: 'Chaussures' },
];

/**
 * Retourne le nom d'une catégorie à partir de son ID
 */
export function getNomCategorieById(id: number | undefined): string {
  if (!id) return 'N/A';
  return sampleCategories.find((c) => c.id === id)?.nom ?? 'N/A';
}

/**
 * Permet de retrouver un ID de catégorie à partir de son nom
 */
export function getCategorieIdByNom(nom: string): number {
  const found = sampleCategories.find((c) => c.nom.toLowerCase() === nom.toLowerCase());
  return found?.id ?? 0; // 0 pour indiquer "non trouvé"
}

/**
 * Données d'exemple pour les produits (stock initial)
 */


export type Produit = {
  id: number;
  nom: string;
  code_barre?: string;
  categorieId: number;
  categorie?: string; // optionnel, seulement utile pour affichage
  prix_vente: number;
  quantite_stock: number;
  alerte_stock: number;
};


export const sampleProduits = [
  {
    id: 1,
    nom: "Exemple Produit",
    code_barre: "1234567890123",
    categorie: 1,
    prix_vente: 2000,
    quantite_stock: 10,
    alerte_stock: 3,
  },
];




/**
 * Modèles de facture disponibles dans l'application
 */
export const sampleFactureModeles: FactureModele[] = [
  { 
    id: 'tmpl-1', 
    nom: 'Facture Standard', 
    headerContent: 'FACTURE',
    footerContent: 'Merci pour votre confiance.\nPaiement à réception de la facture.',
    primaryColor: '231 48% 48%', // hsl format
    logoUrl: '',
  },
  { 
    id: 'tmpl-2', 
    nom: 'Facture Proforma',
    headerContent: 'FACTURE PROFORMA',
    footerContent: 'Cette facture proforma est valable pour une durée de 30 jours.',
    primaryColor: '12 76% 61%',
    logoUrl: '',
  },
];



