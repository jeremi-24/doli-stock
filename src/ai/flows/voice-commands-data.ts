
export const voiceCommandExamples = `
---
#### Exemples de Commandes Vocales

Voici des exemples de commandes que les utilisateurs pourraient formuler. Utilise-les pour mieux comprendre leur intention.

#### Gestion des Utilisateurs et Rôles

- **getUsers**:
  - "Montre la liste des utilisateurs."
  - "Qui peut utiliser le système ?"
- **createUser**:
  - "Ajoute un nouvel utilisateur."
  - "Crée un compte pour [Nom de la personne]."
- **updateUser**:
  - "Modifie l'utilisateur [Nom de la personne]."
  - "Change le mot de passe de [Nom de la personne]."
- **deleteUser**:
  - "Supprime l'utilisateur [Nom de la personne]."
  - "Bloque l'accès à [Nom de la personne]."
- **getRoles**:
  - "Quels sont les rôles disponibles ?"
  - "Montre-moi les différents types de comptes."
- **createRole**:
  - "Crée un rôle [Nom du rôle], par exemple, 'vendeur'."
- **updateRole**:
  - "Modifie le rôle [Nom du rôle]."
- **deleteRole**:
  - "Supprime le rôle [Nom du rôle]."

#### Gestion des Produits et Catégories

- **getProducts**:
  - "Montre-moi la liste de tous les produits."
  - "Qu'est-ce qu'on a en stock ?"
- **getProductById / getProductByBarcode**:
  - "Trouve le produit [Nom ou référence du produit]."
  - "Donne-moi les détails sur le produit [Nom du produit]."
- **createProduct**:
  - "Ajoute un nouveau produit."
  - "Je veux enregistrer un nouvel article."
- **updateProduct**:
  - "Mets à jour le produit [Nom du produit]."
  - "Change le prix de [Nom du produit] à [Nouveau prix]."
- **deleteProducts**:
  - "Supprime le produit [Nom du produit]."
- **printBarcodes / printMultipleBarcodes**:
  - "Imprime les étiquettes pour [Nom du produit]."
  - "Sors-moi les étiquettes pour [Nom du produit 1], [Nom du produit 2] et [Nom du produit 3]."
- **getCategories**:
  - "Liste toutes les catégories de produits."
- **createCategory**:
  - "Crée la catégorie [Nom de la catégorie]."
- **updateCategory**:
  - "Renomme la catégorie [Ancien nom] en [Nouveau nom]."

#### Gestion des Stocks et Lieux de Stockage

- **getLieuxStock**:
  - "Où sont nos lieux de stockage ?"
  - "Montre-moi la liste des magasins et dépôts."
- **createLieuStock**:
  - "Ajoute un nouveau lieu de stock appelé [Nom du lieu]."
- **getStocks**:
  - "Fais le point du stock."
  - "Montre l'état de tous les stocks."
- **getStocksByLieuId**:
  - "Montre le stock du [Nom du lieu]."
- **exportStockByLieu**:
  - "Exporte le stock du [Nom du lieu] en fichier Excel."
- **corrigerStock**:
  - "Corrige le stock de [Nom du produit] dans le [Nom du lieu], il y a maintenant [quantité]."

#### Gestion des Ventes et Commandes

- **getCommandes**:
  - "Affiche les commandes en attente."
- **createCommande**:
  - "Je veux passer une nouvelle commande."
  - "Crée une commande pour le client [Nom du client]."
- **validerCommande**:
  - "Valide la commande de [Nom du client]."
- **annulerCommande**:
  - "Annule la commande numéro [Numéro de commande]."
- **getVentes**:
  - "Montre l'historique des ventes."
- **getVentesCreditEnCours**:
  - "Qui sont les clients qui nous doivent de l'argent ?"
  - "Montre la liste des crédits en cours."
- **createVenteDirecte**:
  - "Enregistre une nouvelle vente."
  - "Je fais une vente directe pour [Nom du produit] au prix de [Prix]."
- **addPaiementCredit**:
  - "Le client [Nom du client] a payé [Montant]."
  - "Enregistre un paiement pour le crédit de [Nom du client]."

#### Facturation et Livraison

- **getFactures**:
  - "Montre-moi toutes les factures."
- **searchFactures**:
  - "Recherche la facture du client [Nom du client] du [Date]."
- **getAllBonsLivraison**:
  - "Liste tous les bons de livraison."
- **validerLivraisonEtape1**:
  - "Valide la livraison pour le secrétariat."
- **validerLivraisonEtape2**:
  - "Confirme la réception de la marchandise au magasin."

#### Inventaires et Approvisionnements

- **getInventaires**:
  - "Montre-moi les anciens inventaires."
- **calculateInventaire**:
  - "Prépare un nouvel inventaire."
  - "Calcule les écarts de stock pour un nouvel inventaire."
- **confirmInventaire**:
  - "Confirme l'inventaire du [Date]."
- **getReapprovisionnements**:
  - "Montre les derniers arrivages de marchandises."
- **createReapprovisionnement**:
  - "Enregistre un nouvel arrivage."

#### Gestion des Clients et de l'Organisation

- **getClients**:
  - "Affiche la liste de tous mes clients."
- **createClient**:
  - "Ajoute le nouveau client [Nom du client] avec le numéro [Numéro de téléphone]."
- **updateClient**:
  - "Modifie les informations du client [Nom du client]."
- **getOrganisations**:
  - "Montre-moi les informations de mon entreprise."
- **saveOrganisation**:
  - "Change l'adresse de l'entreprise."

#### Suivi et Logs

- **getLogs**:
  - "Montre-moi l'historique des actions d'aujourd'hui."
  - "Qui a fait quoi sur le système ?"
`;
