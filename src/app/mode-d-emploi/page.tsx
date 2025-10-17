
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Step = {
  title: string;
  imageSeed: string;
  description: string;
};

type Action = {
  id: string;
  title: string;
  steps: Step[];
};

type Section = {
  id: string;
  title: string;
  goal: string;
  link: string;
  keywords: string[];
  actions: Action[];
  importantNote?: {
      level: 'info' | 'danger';
      text: string;
  }
};

const helpContent: Section[] = [
  {
    id: 'inventories',
    title: 'Faire un Inventaire',
    goal: 'Comparer le stock réel avec le stock de l\'application pour corriger les différences.',
    link: '/inventories',
    keywords: ['inventaire', 'comptage', 'stock physique', 'écart', 'correction'],
    actions: [
      {
        id: 'create-inventory',
        title: 'Comment lancer un nouvel inventaire',
        steps: [
          {
            title: 'Étape 1 : Accéder à la page des inventaires',
            imageSeed: 'inventory_step1',
            description: "Depuis le menu de navigation, cliquez sur 'Inventaires' pour voir l'historique de vos inventaires.",
          },
          {
            title: 'Étape 2 : Lancer un nouvel inventaire',
            imageSeed: 'inventory_step2',
            description: "Cliquez sur le bouton 'Nouvel Inventaire' en haut à droite de la page.",
          },
          {
            title: 'Étape 3 : Sélectionner le lieu de stock',
            imageSeed: 'inventory_step3',
            description: "Choisissez dans la liste le magasin ou l'entrepôt que vous souhaitez inventorier. C'est une étape cruciale pour que le système sache quel stock comparer.",
          },
          {
            title: 'Étape 4 : Saisir les quantités réelles',
            imageSeed: 'inventory_step4',
            description: "Comptez physiquement vos produits. Entrez ensuite les quantités dans la liste affichée (mode Saisie) ou scannez les codes-barres (mode Scan).",
          },
          {
            title: 'Étape 5 : Calculer et vérifier les écarts',
            imageSeed: 'inventory_step5',
            description: "Une fois le comptage terminé, cliquez sur 'Calculer les écarts'. Une page de détails s'ouvrira, montrant les différences between le stock théorique et votre comptage.",
          },
          {
            title: 'Étape 6 : Confirmer et appliquer au stock',
            imageSeed: 'inventory_step6',
            description: "Si les écarts vous semblent corrects, cliquez sur 'Appliquer les Écarts au Stock'. Cette action mettra à jour définitivement votre stock. Attention, elle est irréversible.",
          },
        ],
      },
    ],
  },
  {
    id: 'orders',
    title: 'Gérer les Commandes Internes',
    goal: 'Générer une demande de sortie de stock pour un client interne ou un autre service.',
    link: '/orders',
    keywords: ['commande', 'interne', 'sortie de stock', 'validation', 'facture', 'bon de livraison'],
    actions: [
      {
        id: 'create-order',
        title: 'Comment créer une nouvelle commande',
        steps: [
           {
            title: 'Étape 1 : Démarrer une nouvelle commande',
            imageSeed: 'order_step1',
            description: "Allez sur la page 'Commandes' et cliquez sur 'Nouvelle Commande'.",
          },
          {
            title: 'Étape 2 : Renseigner les informations',
            imageSeed: 'order_step2',
            description: "Sélectionnez le client qui fait la demande et le lieu de stock où les produits seront prélevés.",
          },
          {
            title: 'Étape 3 : Ajouter les produits au panier',
            imageSeed: 'order_step3',
            description: "Recherchez et ajoutez les produits un par un. Ajustez les quantités pour chaque produit directement dans le panier.",
          },
          {
            title: 'Étape 4 : Soumettre la commande',
            imageSeed: 'order_step4',
            description: "Une fois le panier vérifié, cliquez sur 'Créer la Commande'. Une fenêtre de confirmation apparaîtra pour une dernière vérification avant de soumettre.",
          },
        ],
      },
      {
        id: 'validate-order',
        title: 'Comment valider une commande',
        steps: [
           {
            title: 'Étape 1 : Trouver la commande en attente',
            imageSeed: 'order_validate1',
            description: "Sur la page 'Commandes', repérez la commande ayant le statut 'EN ATTENTE' que vous souhaitez traiter.",
          },
          {
            title: 'Étape 2 : Ouvrir le menu d\'actions',
            imageSeed: 'order_validate2',
            description: "Cliquez sur le menu d'actions (les trois points) à droite de la ligne de la commande.",
          },
          {
            title: 'Étape 3 : Valider la commande',
            imageSeed: 'order_validate3',
            description: "Cliquez sur 'Valider'. Le système déduira automatiquement les quantités du stock et générera la facture et le bon de livraison associés.",
          },
           {
            title: 'Étape 4 : Consulter les documents',
            imageSeed: 'order_validate4',
            description: "Après validation, vous serez redirigé vers une page où vous pourrez visualiser et imprimer la facture et le bon de livraison.",
          },
        ],
      },
    ],
  },
    {
    id: 'deliveries',
    title: 'Suivre les Bons de Livraison',
    goal: 'Suivre le processus de validation des bons de livraison, de la préparation à la réception par le client.',
    link: '/deliveries',
    keywords: ['livraison', 'validation', 'secrétariat', 'magasinier', 'réception'],
    actions: [
      {
        id: 'validate-delivery',
        title: 'Comment valider un bon de livraison',
        steps: [
            {
              title: 'Étape 1 : Le Secrétariat valide le BL',
              imageSeed: 'delivery_step1',
              description: "Un utilisateur avec le rôle 'Secrétariat' ou 'Admin' doit se rendre sur la page 'Bons de Livraison', trouver le BL avec le statut 'EN ATTENTE' et cliquer sur 'Valider BL'. Le statut passe à 'À livrer'.",
            },
            {
              title: 'Étape 2 : Le Magasinier confirme la réception',
              imageSeed: 'delivery_step2',
              description: "Une fois que le client a physiquement reçu la marchandise, un utilisateur avec le rôle 'Magasinier' ou 'Admin' doit trouver le BL avec le statut 'À livrer' et cliquer sur 'Confirmer Réception'. Le statut final devient 'Livré'.",
            },
        ],
      },
    ],
  },
  {
    id: 'invoicing',
    title: 'Consulter les Factures',
    goal: 'Retrouver, consulter et filtrer toutes les factures qui ont été générées à partir des commandes validées.',
    link: '/invoicing',
    keywords: ['facture', 'historique', 'recherche', 'filtre'],
    actions: [
      {
        id: 'view-invoices',
        title: 'Comment voir et filtrer les factures',
        steps: [
            {
              title: 'Étape 1 : Accéder à la page des factures',
              imageSeed: 'invoice_step1',
              description: "Cliquez sur 'Factures' dans le menu de navigation pour afficher la liste de toutes les factures générées.",
            },
            {
              title: 'Étape 2 : Utiliser les filtres',
              imageSeed: 'invoice_step2',
              description: "Utilisez la barre de recherche pour trouver une facture par son numéro, ou le nom du client. Vous pouvez également filtrer par client ou par période pour affiner les résultats.",
            },
            {
              title: 'Étape 3 : Voir les détails',
              imageSeed: 'invoice_step3',
              description: "Cliquez sur l'icône en forme d'œil (👁️) pour être redirigé vers la page de la commande correspondante, où vous pourrez voir et imprimer la facture.",
            },
        ],
      },
    ],
  },
  {
    id: 'sales-history',
    title: 'Gérer l\'Historique des Ventes',
    goal: 'Consulter les ventes rapides du point de vente (POS), gérer les crédits et enregistrer les paiements.',
    link: '/sales',
    keywords: ['ventes', 'historique', 'crédit', 'paiement', 'filtre'],
    actions: [
      {
        id: 'view-sales',
        title: 'Consulter et filtrer l\'historique',
        steps: [
            {
              title: 'Étape 1 : Accéder à l\'historique',
              imageSeed: 'sales_step1',
              description: "Allez sur la page 'Historique des Ventes' pour voir toutes les transactions enregistrées.",
            },
            {
              title: 'Étape 2 : Filtrer les ventes',
              imageSeed: 'sales_step2',
              description: "Utilisez l'interrupteur 'Crédits en cours' pour n'afficher que les ventes avec un solde à payer. Vous pouvez aussi filtrer par période pour voir les ventes d'une semaine ou d'un mois précis.",
            },
        ],
      },
       {
        id: 'manage-credit',
        title: 'Gérer un crédit',
        steps: [
            {
              title: 'Étape 1 : Identifier la vente à crédit',
              imageSeed: 'credit_step1',
              description: "Dans l'historique, repérez la vente avec le statut 'EN_ATTENTE'. Le montant dû est affiché en rouge.",
            },
            {
              title: 'Étape 2 : Ajouter un paiement',
              imageSeed: 'credit_step2',
              description: "Cliquez sur le bouton 'Ajouter Paiement'. Une fenêtre s'ouvrira pour vous permettre de saisir le montant et le mode de paiement.",
            },
             {
              title: 'Étape 3 : Confirmer',
              imageSeed: 'credit_step3',
              description: "Validez le paiement. Le solde restant sera automatiquement mis à jour. Répétez l'opération jusqu'à ce que le solde soit à zéro.",
            },
        ],
      },
    ],
  },
  {
    id: 'pos',
    title: 'Utiliser le Point de Vente (POS)',
    goal: 'Enregistrer une vente rapide au comptant ou à crédit pour un client.',
    link: '/pos',
    keywords: ['pos', 'caisse', 'vente', 'scanner', 'panier', 'crédit'],
    actions: [
      {
        id: 'create-pos-sale',
        title: 'Comment enregistrer une vente',
        steps: [
            {
              title: 'Étape 1 : Ajouter des produits au panier',
              imageSeed: 'pos_step1',
              description: "Scannez le code-barres d'un produit ou cliquez sur un article dans la liste. Le produit sera automatiquement ajouté au panier.",
            },
            {
              title: 'Étape 2 : Ajuster les quantités',
              imageSeed: 'pos_step2',
              description: "Dans le panier, vous pouvez facilement augmenter ou diminuer la quantité de chaque article avec les boutons (+) et (-).",
            },
            {
              title: 'Étape 3 : Finaliser la vente',
              imageSeed: 'pos_step3',
              description: "Cliquez sur 'Finaliser la Vente'. Une boîte de dialogue s'ouvrira pour confirmer les détails du paiement.",
            },
            {
              title: 'Étape 4 : Confirmer le paiement',
              imageSeed: 'pos_step4',
              description: "Choisissez le client, le type de paiement (Comptant ou Crédit) et validez. La vente est alors enregistrée et le stock mis à jour.",
            },
        ],
      },
    ],
  },
  {
    id: 'reapprovisionnement',
    title: 'Enregistrer un arrivage (Réapprovisionnement)',
    goal: 'Mettre à jour le stock en enregistrant l\'entrée de nouvelles marchandises.',
    link: '/reapprovisionnements',
    keywords: ['arrivage', 'entrée de stock', 'fournisseur', 'réappro'],
    actions: [
      {
        id: 'create-reappro',
        title: 'Comment enregistrer un nouvel arrivage',
        steps: [
            {
              title: 'Étape 1 : Aller sur la page Réapprovisionnements',
              imageSeed: 'reappro_step1',
              description: "Cliquez sur 'Réapprovisionnement' dans le menu, puis sur 'Nouveau Réapprovisionnement'.",
            },
            {
              title: 'Étape 2 : Sélectionner le lieu de destination',
              imageSeed: 'reappro_step2',
              description: "Choisissez le magasin ou l'entrepôt où les nouveaux produits seront stockés.",
            },
            {
              title: 'Étape 3 : Scanner les produits',
              imageSeed: 'reappro_step3',
              description: "Scannez le code-barres de chaque produit reçu. Indiquez la quantité et si vous ajoutez des unités ou des cartons. Les produits s'ajoutent à la liste de l'arrivage.",
            },
            {
              title: 'Étape 4 : Enregistrer l\'arrivage',
              imageSeed: 'reappro_step4',
              description: "Une fois tous les produits scannés, cliquez sur 'Enregistrer l'arrivage'. Le système ajoutera les quantités au stock du lieu sélectionné.",
            },
        ],
      },
    ],
  },
  {
    id: 'products',
    title: 'Gérer les Produits',
    goal: 'Créer, consulter, modifier et supprimer les fiches des produits de votre catalogue.',
    link: '/products',
    keywords: ['produit', 'article', 'catalogue', 'prix', 'référence', 'import'],
    actions: [
      {
        id: 'create-product',
        title: 'Comment créer un nouveau produit',
        steps: [
            {
              title: 'Étape 1 : Accéder à la page Produits',
              imageSeed: 'product_step1',
              description: "Cliquez sur 'Produits' dans le menu de navigation.",
            },
            {
              title: 'Étape 2 : Ouvrir le formulaire de création',
              imageSeed: 'product_step2',
              description: "Cliquez sur le bouton 'Ajouter' en haut à droite.",
            },
            {
              title: 'Étape 3 : Remplir les informations',
              imageSeed: 'product_step3',
              description: "Remplissez tous les champs requis comme le nom, la catégorie, le prix de vente unitaire et le prix par carton. La référence et le seuil d'alerte sont aussi importants.",
            },
            {
              title: 'Étape 4 : Sauvegarder',
              imageSeed: 'product_step4',
              description: "Cliquez sur 'Créer' pour ajouter le nouveau produit à votre catalogue. Il sera immédiatement disponible dans tout le système.",
            },
        ],
      },
      {
        id: 'import-products',
        title: 'Comment importer des produits depuis Excel',
        steps: [
            {
              title: 'Étape 1 : Préparer le fichier Excel',
              imageSeed: 'import_step1',
              description: "Créez un fichier Excel (.xlsx ou .csv) avec les colonnes suivantes : nom, ref, codeBarre, categorieId, lieuStockId, prix, qte, qteMin. Assurez-vous que les IDs de catégorie et de lieu existent déjà dans le système.",
            },
            {
              title: 'Étape 2 : Aller à la page d\'import',
              imageSeed: 'import_step2',
              description: "Cliquez sur 'Paramètres' dans le menu, puis sélectionnez l'onglet 'Import/Export'.",
            },
            {
              title: 'Étape 3 : Importer le fichier',
              imageSeed: 'import_step3',
              description: "Cliquez sur 'Importer un fichier', sélectionnez votre fichier Excel, puis validez. Les nouveaux produits seront ajoutés et les produits existants mis à jour.",
            },
        ],
      },
    ],
  },
  {
    id: 'categories',
    title: 'Gérer les Catégories',
    goal: 'Organiser vos produits en groupes logiques pour faciliter la recherche et la gestion.',
    link: '/categories',
    keywords: ['catégorie', 'groupe', 'famille', 'organisation'],
    actions: [
      {
        id: 'create-category',
        title: 'Comment créer une nouvelle catégorie',
        steps: [
            {
              title: 'Étape 1 : Accéder à la page Catégories',
              imageSeed: 'category_step1',
              description: "Cliquez sur 'Catégories' dans le menu de navigation.",
            },
            {
              title: 'Étape 2 : Ouvrir le formulaire',
              imageSeed: 'category_step2',
              description: "Cliquez sur le bouton 'Ajouter une catégorie'.",
            },
            {
              title: 'Étape 3 : Donner un nom',
              imageSeed: 'category_step3',
              description: "Entrez un nom clair et concis pour votre catégorie (ex: 'Boissons', 'Huiles Moteur', 'Pièces détachées').",
            },
            {
              title: 'Étape 4 : Créer la catégorie',
              imageSeed: 'category_step4',
              description: "Cliquez sur 'Créer'. Vous pourrez ensuite assigner des produits à cette nouvelle catégorie lors de leur création ou modification.",
            },
        ],
      },
    ],
  },
  {
    id: 'lieux-stock',
    title: 'Gérer les Lieux de Stock',
    goal: 'Définir les différents endroits (magasins, entrepôts, boutiques) où votre stock est entreposé.',
    link: '/entrepots',
    keywords: ['lieu', 'entrepôt', 'magasin', 'boutique', 'stockage'],
    importantNote: {
        level: 'danger',
        text: 'Il est crucial de créer au moins un lieu de stock AVANT de réaliser toute autre opération (création de produit, inventaire, etc.).'
    },
    actions: [
      {
        id: 'create-lieu',
        title: 'Comment créer un lieu de stock',
        steps: [
            {
              title: 'Étape 1 : Accéder à la page',
              imageSeed: 'lieu_step1',
              description: "Cliquez sur 'Lieux de Stock' dans le menu de navigation.",
            },
            {
              title: 'Étape 2 : Lancer la création',
              imageSeed: 'lieu_step2',
              description: "Cliquez sur le bouton 'Ajouter un lieu'.",
            },
            {
              title: 'Étape 3 : Remplir les informations',
              imageSeed: 'lieu_step3',
              description: "Donnez un nom (ex: Magasin Principal), un type (ex: Magasin) et une localisation (ex: Lomé Centre).",
            },
            {
              title: 'Étape 4 : Enregistrer',
              imageSeed: 'lieu_step4',
              description: "Cliquez sur 'Créer' pour sauvegarder votre nouveau lieu de stock.",
            },
        ],
      },
    ],
  },
  {
    id: 'clients',
    title: 'Gérer les Clients',
    goal: 'Créer et administrer la liste de vos clients, qu\'ils soient internes ou externes.',
    link: '/clients',
    keywords: ['client', 'utilisateur', 'interne', 'externe'],
    importantNote: {
        level: 'info',
        text: 'Un utilisateur de l\'application (ex: un département) doit aussi être créé en tant que client pour pouvoir passer des commandes internes.'
    },
    actions: [
      {
        id: 'create-client',
        title: 'Comment ajouter un client',
        steps: [
            {
              title: 'Étape 1 : Accéder à la page',
              imageSeed: 'client_step1',
              description: "Cliquez sur 'Clients' dans le menu de navigation.",
            },
            {
              title: 'Étape 2 : Lancer la création',
              imageSeed: 'client_step2',
              description: "Cliquez sur le bouton 'Ajouter un client'.",
            },
            {
              title: 'Étape 3 : Remplir les informations',
              imageSeed: 'client_step3',
              description: "Entrez le nom du client et, si possible, son numéro de téléphone.",
            },
            {
              title: 'Étape 4 : Enregistrer',
              imageSeed: 'client_step4',
              description: "Cliquez sur 'Créer' pour ajouter le client à votre liste.",
            },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Gérer les Utilisateurs & Rôles',
    goal: 'Administrer les accès à l\'application, créer des comptes utilisateurs et définir leurs permissions.',
    link: '/settings',
    keywords: ['paramètres', 'utilisateur', 'rôle', 'permission', 'accès'],
    actions: [
      {
        id: 'create-user',
        title: 'Comment créer un utilisateur',
        steps: [
            {
              title: 'Étape 1 : Aller dans les Paramètres',
              imageSeed: 'user_step1',
              description: "Cliquez sur 'Paramètres' dans le menu, puis assurez-vous d'être dans l'onglet 'Utilisateurs'.",
            },
            {
              title: 'Étape 2 : Ouvrir le formulaire',
              imageSeed: 'user_step2',
              description: "Cliquez sur le bouton 'Ajouter un utilisateur'.",
            },
            {
              title: 'Étape 3 : Remplir les informations',
              imageSeed: 'user_step3',
              description: "Saisissez l'adresse e-mail, un mot de passe, puis assignez un rôle et un lieu de stock à ce nouvel utilisateur.",
            },
            {
              title: 'Étape 4 : Créer le compte',
              imageSeed: 'user_step4',
              description: "Cliquez sur 'Créer'. L'utilisateur pourra alors se connecter avec les identifiants que vous venez de définir.",
            },
        ],
      },
      {
        id: 'manage-roles',
        title: 'Comment gérer les permissions d\'un rôle',
        steps: [
            {
              title: 'Étape 1 : Accéder aux Rôles',
              imageSeed: 'role_step1',
              description: "Cliquez sur 'Paramètres' dans le menu, puis allez dans l'onglet 'Rôles & Permissions'.",
            },
            {
              title: 'Étape 2 : Créer ou modifier un rôle',
              imageSeed: 'role_step2',
              description: "Cliquez sur 'Nouveau Rôle' ou sur l'icône de crayon pour modifier un rôle existant.",
            },
            {
              title: 'Étape 3 : Assigner les permissions',
              imageSeed: 'role_step3',
              description: "Une fenêtre s'ouvrira avec une liste de toutes les actions possibles. Cochez les cases correspondant aux permissions que vous souhaitez accorder à ce rôle.",
            },
            {
              title: 'Étape 4 : Enregistrer',
              imageSeed: 'role_step4',
              description: "Cliquez sur 'Enregistrer'. Tous les utilisateurs ayant ce rôle auront leurs permissions mises à jour instantanément.",
            },
        ],
      },
    ],
  },
];


const StepCard = ({ step }: { step: Step }) => (
  <div className="flex flex-col sm:flex-row gap-4 items-start py-4">
    <Image
      src={`/${step.imageSeed}.svg`}
      alt={`Illustration pour ${step.title}`}
      width={400}
      height={250}
      className="rounded-lg object-cover sm:w-1/3 aspect-video"
      data-ai-hint={`screenshot step ${step.title}`}
    />
    <div className="flex-1">
      <h5 className="font-bold text-base mb-2">{step.title}</h5>
      <p className="text-muted-foreground">{step.description}</p>
    </div>
  </div>
);

const ActionAccordion = ({ action }: { action: Action }) => (
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value={action.id}>
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">{action.title}</AccordionTrigger>
      <AccordionContent className="divide-y">
        {action.steps.map((step, index) => (
          <StepCard key={index} step={step} />
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);


const HelpItem = ({ section, isFaded }: { section: Section, isFaded: boolean }) => (
  <AccordionItem value={section.id} className={cn("transition-opacity", isFaded && "opacity-30")}>
    <AccordionTrigger className="text-2xl font-headline hover:no-underline">
      {section.title}
    </AccordionTrigger>
    <AccordionContent className="prose prose-sm max-w-none space-y-6 pt-4">
      
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-1 text-lg">Objectif</h4>
        <p className="text-muted-foreground text-base">{section.goal}</p>
      </div>

       {section.importantNote && (
            <Alert variant={section.importantNote.level === 'danger' ? 'destructive' : 'default'} className="bg-yellow-50 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                    {section.importantNote.level === 'danger' ? 'Attention !' : 'Information importante'}
                </AlertTitle>
                <AlertDescription>
                    {section.importantNote.text}
                </AlertDescription>
            </Alert>
        )}
      
      <div className="space-y-4">
        {section.actions.map((action) => (
          <ActionAccordion key={action.id} action={action} />
        ))}
      </div>

      <div className="pt-4">
        <Link href={section.link} passHref legacyBehavior>
          <Button asChild variant="outline">
            <a>Aller à la page "{section.title}" <ExternalLink className="ml-2 h-4 w-4"/></a>
          </Button>
        </Link>
      </div>

    </AccordionContent>
  </AccordionItem>
);

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContent = useMemo(() => {
    if (!searchTerm) {
      return helpContent;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return helpContent.filter(section => 
        section.title.toLowerCase().includes(lowerCaseSearch) ||
        section.goal.toLowerCase().includes(lowerCaseSearch) ||
        section.keywords.some(kw => kw.toLowerCase().includes(lowerCaseSearch))
    );
  }, [searchTerm]);
  
  const filteredIds = useMemo(() => new Set(filteredContent.map(s => s.id)), [filteredContent]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-4xl">Mode d'emploi</CardTitle>
          <CardDescription>
            Trouvez des réponses à vos questions sur le fonctionnement de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une fonctionnalité (ex: 'commande', 'inventaire')..."
              className="pl-10 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Accordion type="single" collapsible className="w-full" defaultValue={searchTerm ? filteredIds.values().next().value : undefined}>
            {helpContent.map((section) => (
              <HelpItem 
                key={section.id} 
                section={section}
                isFaded={searchTerm.length > 0 && !filteredIds.has(section.id)}
              />
            ))}
             {searchTerm.length > 0 && filteredContent.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucune section d'aide ne correspond à votre recherche.</p>
                </div>
             )}
          </Accordion>

        </CardContent>
      </Card>
    </div>
  );
}
