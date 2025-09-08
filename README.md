d draft feature
# STA - Stock Management

![Logo STA](public/logosta.jpg)

**STA** est une application web complète et moderne conçue pour la gestion avancée des stocks, des ventes et des opérations commerciales. Elle offre une interface intuitive et des fonctionnalités puissantes pour optimiser les flux de travail, de la réception des produits à la facturation client.

##  Fonctionnalités Principales

- **Tableau de Bord Intuitif** : Visualisez en un coup d'œil les indicateurs clés de performance (KPIs) comme la valeur totale du stock, les alertes de stock faible et l'activité récente.
- **Gestion de Produits & Catalogue** : Créez, modifiez et organisez facilement vos produits avec des détails riches (prix, références, seuils d'alerte, prix par carton, etc.).
- **Gestion de Stock Multi-Entrepôts** : Suivez les niveaux de stock en temps réel pour chaque produit dans différents lieux de stockage (magasins, entrepôts).
- **Point de Vente (POS)** : Une interface de caisse rapide et ergonomique pour enregistrer les ventes directes, avec un panier interactif et une gestion des clients.
- **Système de Commandes Internes** : Gérez les demandes de produits entre différents services ou clients internes, avec un flux de validation complet.
- **Facturation et Bons de Livraison Automatisés** : Générez automatiquement des factures et des bons de livraison professionnels à partir des commandes validées.
- **Inventaires et Réapprovisionnements** : Réalisez des inventaires précis grâce à un scanner de codes-barres et enregistrez facilement les nouveaux arrivages de stock.
- **Gestion des Rôles & Permissions** : Un système de contrôle d'accès basé sur les rôles (RBAC) flexible pour définir des permissions granulaires pour chaque utilisateur (ex: Admin, Secrétariat, Magasinier).
- **Notifications en Temps Réel** : Restez informé des événements importants (nouvelles commandes, validations) grâce aux notifications push via WebSockets.
- **Personnalisation** : Adaptez l'application à l'image de votre entreprise en modifiant les informations de l'organisation et les couleurs du thème.

## 🚀 Technologies Utilisées

Ce projet est construit avec une architecture moderne, performante et maintenable.

- **Framework Frontend** : [Next.js](https://nextjs.org/) (avec App Router)
- **Bibliothèque UI** : [React](https://react.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **Composants UI** : [Shadcn/UI](https://ui.shadcn.com/)
- **Gestion d'État** : React Context API & Hooks
- **Communication Temps Réel** : WebSockets (avec STOMP.js et SockJS)
- **Validation de Formulaires** : React Hook Form & Zod
- **Backend (API)** : L'application communique avec une API RESTful externe (non incluse dans ce dépôt).

## ⚙️ Démarrage

Suivez ces étapes pour lancer l'application en environnement de développement.

### Prérequis

- [Node.js](https://nodejs.org/) (version 18.x ou supérieure)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### 1. Installation

Clonez le dépôt et installez les dépendances :

```bash
git clone <url-du-depot>
cd <nom-du-dossier>
npm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet pour configurer l'URL de l'API backend et du serveur WebSocket.

```env
# URL de base de votre API backend
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# URL de votre serveur WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws-notifications
```

### 3. Lancer le serveur de développement

Vous pouvez maintenant lancer l'application :

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 📄 Scripts Disponibles

- `npm run dev`: Lance l'application en mode développement.
- `npm run build`: Construit l'application pour la production.
- `npm run start`: Démarre un serveur de production.
- `npm run lint`: Exécute ESLint pour analyser le code.
- `npm run typecheck`: Vérifie les types TypeScript sans émettre de fichiers.

---

