import type { Produit, Categorie, FactureModele } from './types';

export const sampleCategories: Categorie[] = [
  { id: 1, nom: 'Boissons' },
  { id: 2, nom: 'Alimentation' },
  { id: 3, nom: 'Textile' },
  { id: 4, nom: 'Hygiène' },
  { id: 5, nom: 'Services' },
  { id: 6, nom: 'Chaussures' },
];

export const sampleProduits: Produit[] = [
  {
    id: 1,
    nom: 'Pagne Wax Hollandais',
    code_barre: '6151234567890',
    categorie_id: 3,
    prix_vente: 15000,
    quantite_stock: 50,
    alerte_stock: 10,
  },
  {
    id: 2,
    nom: 'Sac de Gari 5kg',
    code_barre: '6152345678901',
    categorie_id: 2,
    prix_vente: 3500,
    quantite_stock: 100,
    alerte_stock: 20,
  },
  {
    id: 3,
    nom: 'Bouteille de Sodabi 1L',
    code_barre: '6153456789012',
    categorie_id: 1,
    prix_vente: 2500,
    quantite_stock: 80,
    alerte_stock: 15,
  },
  {
    id: 4,
    nom: 'Sandales en plastique',
    code_barre: '6154567890123',
    categorie_id: 6,
    prix_vente: 1000,
    quantite_stock: 200,
    alerte_stock: 50,
  },
  {
    id: 5,
    nom: 'Boisson Bissap 50cl',
    code_barre: '6155678901234',
    categorie_id: 1,
    prix_vente: 500,
    quantite_stock: 150,
    alerte_stock: 30,
  },
  {
    id: 6,
    nom: 'Huile de palme 1.5L',
    code_barre: '6156789012345',
    categorie_id: 2,
    prix_vente: 2000,
    quantite_stock: 90,
    alerte_stock: 20,
  },
    {
    id: 7,
    nom: 'Carte de recharge T-Money 1000F',
    code_barre: '6157890123456',
    categorie_id: 5,
    prix_vente: 1000,
    quantite_stock: 500,
    alerte_stock: 50,
  },
  {
    id: 8,
    nom: 'Savon local (Kpékui)',
    code_barre: '6158901234567',
    categorie_id: 4,
    prix_vente: 250,
    quantite_stock: 300,
    alerte_stock: 100,
  },
];


export const sampleFactureModeles: FactureModele[] = [
  { 
    id: 'tmpl-1', 
    nom: 'Facture Standard', 
    headerContent: 'FACTURE',
    footerContent: 'Merci pour votre confiance.\nPaiement à réception de la facture.',
    primaryColor: '231 48% 48%',
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
