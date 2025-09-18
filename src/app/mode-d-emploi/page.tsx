
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  actions: Action[];
  link: string;
  keywords: string[];
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
            description: "Une fois le comptage terminé, cliquez sur 'Calculer les écarts'. Une page de détails s'ouvrira, montrant les différences entre le stock théorique et votre comptage.",
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
];


const StepCard = ({ step }: { step: Step }) => (
  <div className="flex flex-col sm:flex-row gap-4 items-start py-4">
    <Image
      src={`https://picsum.photos/seed/${step.imageSeed}/400/250`}
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
