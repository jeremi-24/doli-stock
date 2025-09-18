
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

type Section = {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  dos: string[];
  donts: string[];
  link: string;
  keywords: string[];
};

const helpContent: Section[] = [
  {
    id: 'products',
    title: 'Gérer les Produits',
    goal: 'Ajouter, modifier ou supprimer les articles de votre catalogue.',
    steps: [
      "1. Allez à la page 'Produits' depuis le menu de navigation.",
      "2. Pour ajouter un produit, cliquez sur 'Ajouter'. Remplissez les détails comme le nom, le prix, et le seuil d'alerte.",
      "3. Pour modifier un produit, trouvez-le dans la liste et utilisez le menu d'actions (...) pour sélectionner 'Modifier'.",
    ],
    dos: [
      'Toujours assigner une catégorie pour une meilleure organisation.',
      'Renseignez le "Seuil d\'Alerte" pour savoir quand un produit est presque en rupture de stock.',
      'Utilisez des références (réf) uniques pour chaque produit.',
    ],
    donts: [
      'Ne supprimez pas un produit s\'il a déjà été utilisé dans des commandes. Cela pourrait causer des erreurs.',
    ],
    link: '/products',
    keywords: ['produit', 'catalogue', 'article', 'créer', 'modifier', 'supprimer'],
  },
  {
    id: 'orders',
    title: 'Créer une Commande Interne',
    goal: 'Générer une demande de sortie de stock pour un client interne ou un autre service.',
    steps: [
        "1. Allez à la page 'Commandes' et cliquez sur 'Nouvelle Commande'.",
        "2. Sélectionnez le Client (demandeur) et le Lieu de Stock où les produits seront retirés.",
        "3. Ajoutez les produits un par un à la commande en précisant la quantité.",
        "4. Vérifiez le panier, puis cliquez sur 'Créer la Commande' et confirmez.",
    ],
    dos: [
      'Une fois la commande validée, une facture et un bon de livraison sont automatiquement générés.',
      'Assurez-vous que le stock est suffisant avant de valider une commande.',
    ],
    donts: [
      'N\'oubliez pas de valider la commande. Une commande 'en attente' ne déduit pas le stock.',
    ],
    link: '/orders/new',
    keywords: ['commande', 'interne', 'sortie de stock', 'validation', 'facture', 'bon de livraison'],
  },
   {
    id: 'pos',
    title: 'Utiliser le Point de Vente (POS)',
    goal: 'Enregistrer une vente rapide au comptant ou à crédit pour un client.',
     steps: [
        "1. Allez sur la page 'Point de Vente'.",
        "2. Scannez le code-barres d'un produit ou cliquez sur un article dans la liste pour l'ajouter au panier.",
        "3. Ajustez les quantités si nécessaire directement dans le panier.",
        "4. Cliquez sur 'Finaliser la Vente'.",
        "5. Choisissez le client, le type de paiement (Comptant ou Crédit) et validez pour terminer la vente.",
    ],
    dos: [
      'Utilisez un lecteur de code-barres pour aller plus vite.',
      'Associez chaque vente à un client, même si c\'est le "CLIENT GENERIQUE".',
      'Le stock est mis à jour automatiquement après la validation de la vente.',
    ],
    donts: [
      'N\'oubliez pas de finaliser la vente, sinon elle ne sera pas enregistrée.',
    ],
    link: '/pos',
    keywords: ['pos', 'caisse', 'vente', 'scanner', 'panier', 'crédit'],
  },
  {
    id: 'inventories',
    title: 'Faire un Inventaire Physique',
    goal: 'Comparer le stock réel (ce que vous comptez) avec le stock de l\'application pour corriger les différences (écarts).',
    steps: [
        "1. Allez sur 'Inventaires' et cliquez sur 'Nouvel Inventaire'.",
        "2. Sélectionnez le lieu de stock à inventorier.",
        "3. Comptez vos produits. Saisissez les quantités dans la liste ou utilisez le mode scan.",
        "4. Une fois le comptage terminé, cliquez sur 'Calculer les écarts'.",
        "5. Une page de détails s'affiche. Vérifiez bien les écarts calculés.",
        "6. Si tout est correct, cliquez sur 'Appliquer les Écarts au Stock' pour mettre à jour définitivement vos quantités.",
    ],
    dos: [
      'Faites des inventaires réguliers (ex: chaque mois) pour un suivi précis.',
      'Si c\'est votre tout premier inventaire, cochez la case "Ceci est le premier inventaire" pour initialiser votre stock.',
    ],
    donts: [
      'Ne confirmez pas un inventaire à la légère. La mise à jour du stock est irréversible.',
    ],
    link: '/inventories/new',
    keywords: ['inventaire', 'comptage', 'stock physique', 'écart', 'correction'],
  },
    {
    id: 'reappro',
    title: 'Enregistrer un Arrivage (Réapprovisionnement)',
    goal: 'Ajouter de nouvelles quantités de produits à votre stock suite à une livraison fournisseur.',
    steps: [
        "1. Allez sur 'Réapprovisionnement' et cliquez sur 'Nouveau Réapprovisionnement'.",
        "2. Sélectionnez le lieu de stock où les produits sont arrivés.",
        "3. Scannez chaque produit reçu et indiquez la quantité (en Unité ou en Carton).",
        "4. Une fois tous les produits de l'arrivage scannés, cliquez sur 'Enregistrer l'arrivage'.",
    ],
    dos: [
        'Utilisez le mode "Carton" pour ajouter rapidement de grandes quantités.',
        'Vérifiez la liste des produits dans le panier avant de valider.',
    ],
    donts: [
        'Ne mélangez pas les arrivages de différents lieux de stock dans la même session.',
    ],
    link: '/reapprovisionnements/new',
    keywords: ['arrivage', 'réapprovisionnement', 'entrée de stock', 'fournisseur'],
    },
];

const HelpItem = ({ section, isFaded }: { section: Section, isFaded: boolean }) => (
  <AccordionItem value={section.id} className={cn("transition-opacity", isFaded && "opacity-30")}>
    <AccordionTrigger className="text-xl font-headline hover:no-underline">
      {section.title}
    </AccordionTrigger>
    <AccordionContent className="prose prose-sm max-w-none space-y-6 pt-2">
      
      <div>
        <h4 className="font-semibold mb-2 text-base">Objectif</h4>
        <p className="text-muted-foreground">{section.goal}</p>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2 text-base">Comment faire (Étapes Clés)</h4>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {section.steps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
        </ol>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2 text-base">✅ À faire</h4>
          <ul className="list-none space-y-2 p-0">
            {section.dos.map((item, i) => (
              <li key={i} className="flex items-start"><span className="mr-3 mt-1 opacity-50">▪</span>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-base">❌ À ne pas faire</h4>
          <ul className="list-none space-y-2 p-0">
            {section.donts.map((item, i) => (
              <li key={i} className="flex items-start"><span className="mr-3 mt-1 opacity-50">▪</span>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {Array.from({ length: 2 }).map((_, i) => (
            <Image
                key={i}
                src={`https://picsum.photos/seed/${section.id}${i}/600/400`}
                alt={`Illustration pour ${section.title} ${i + 1}`}
                width={600}
                height={400}
                className="rounded-lg object-cover aspect-video"
                data-ai-hint={`screenshot ${section.keywords[0]}`}
            />
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
