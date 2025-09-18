
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
  description: string;
  dos: string[];
  donts: string[];
  link: string;
  keywords: string[];
};

const helpContent: Section[] = [
  {
    id: 'dashboard',
    title: 'Tableau de Bord',
    description: 'Le tableau de bord vous donne une vue d’ensemble rapide de l’état de votre activité : valeur du stock, produits populaires, alertes et activités récentes.',
    dos: [
      'Consultez-le chaque jour pour suivre les indicateurs clés.',
      'Utilisez les statistiques pour identifier les produits qui nécessitent une attention particulière.',
    ],
    donts: [
      'N’ignorez pas les alertes de stock faible.',
    ],
    link: '/',
    keywords: ['dashboard', 'accueil', 'statistiques', 'vue d\'ensemble'],
  },
  {
    id: 'products',
    title: 'Gestion des Produits',
    description: 'Cette section vous permet de créer, consulter, modifier et supprimer les produits de votre inventaire. C’est le cœur de votre catalogue.',
    dos: [
      'Donnez des noms clairs et des références uniques à vos produits.',
      'Renseignez le "Seuil d\'Alerte" pour être notifié quand le stock est bas.',
      'Assignez une catégorie à chaque produit pour une meilleure organisation.',
    ],
    donts: [
      'Ne supprimez pas un produit s’il est encore présent dans des commandes ou des stocks.',
    ],
    link: '/products',
    keywords: ['produit', 'catalogue', 'article', 'modifier', 'ajouter', 'supprimer'],
  },
  {
    id: 'stock',
    title: 'État du Stock',
    description: 'Consultez en temps réel la quantité exacte de chaque produit dans tous vos lieux de stockage (magasins, entrepôts).',
    dos: [
      'Filtrez par lieu de stock pour voir l\'inventaire d\'un endroit précis.',
      'Utilisez la fonction "Corriger" pour ajuster manuellement une quantité en cas d\'erreur.',
    ],
    donts: [
      'N’effectuez des corrections de stock que si vous êtes certain de la nouvelle quantité.',
    ],
    link: '/stock',
    keywords: ['stock', 'quantité', 'inventaire', 'état', 'entrepôt'],
  },
  {
    id: 'orders',
    title: 'Gestion des Commandes Internes',
    description: 'Créez et suivez les demandes de produits entre vos différents services ou pour des clients internes. Une fois validée, une commande génère automatiquement une facture et un bon de livraison.',
    dos: [
      'Vérifiez bien le client et le lieu de stock avant de créer une commande.',
      'Validez les commandes en attente pour déclencher la facturation et la préparation.',
    ],
    donts: [
      'Ne validez pas une commande si vous n’êtes pas sûr que le stock est disponible.',
    ],
    link: '/orders',
    keywords: ['commande', 'interne', 'validation', 'facture', 'bon de livraison'],
  },
   {
    id: 'pos',
    title: 'Point de Vente (POS)',
    description: 'L\'interface de caisse pour enregistrer les ventes directes aux clients. Scannez, ajoutez au panier et finalisez la vente rapidement.',
    dos: [
      'Utilisez un lecteur de code-barres pour ajouter rapidement des produits.',
      'Associez chaque vente à un client (même "CLIENT GENERIQUE").',
      'Choisissez le bon type de paiement (Comptant ou Crédit).',
    ],
    donts: [
      'N\'oubliez pas de finaliser la vente pour que le stock soit mis à jour.',
    ],
    link: '/pos',
    keywords: ['pos', 'caisse', 'vente', 'scanner', 'panier'],
  },
  {
    id: 'inventories',
    title: 'Inventaires Physiques',
    description: 'Effectuez un comptage physique de votre stock (par scan ou manuellement) pour le comparer à votre stock théorique et corriger les écarts.',
    dos: [
      'Faites des inventaires réguliers pour garantir la fiabilité de vos données.',
      'Cochez "Ceci est le premier inventaire" si vous initialisez votre stock pour la première fois.',
      'Après le calcul, analysez bien les écarts avant de confirmer pour mettre à jour le stock.',
    ],
    donts: [
      'Ne confirmez pas un inventaire à la légère, car cela modifie définitivement vos niveaux de stock.',
    ],
    link: '/inventories',
    keywords: ['inventaire', 'comptage', 'scan', 'écart', 'physique'],
  },
];

const HelpItem = ({ section, isFaded }: { section: Section, isFaded: boolean }) => (
  <AccordionItem value={section.id} className={cn("transition-opacity", isFaded && "opacity-30")}>
    <AccordionTrigger className="text-xl font-headline hover:no-underline">
      {section.title}
    </AccordionTrigger>
    <AccordionContent className="prose prose-sm max-w-none space-y-4 pt-2">
      <p className="text-muted-foreground">{section.description}</p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">À faire :</h4>
          <ul className="list-none space-y-2 p-0">
            {section.dos.map((item, i) => (
              <li key={i} className="flex items-start"><span className="mr-2">✅</span>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">À ne pas faire :</h4>
          <ul className="list-none space-y-2 p-0">
            {section.donts.map((item, i) => (
              <li key={i} className="flex items-start"><span className="mr-2">❌</span>{item}</li>
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
        section.description.toLowerCase().includes(lowerCaseSearch) ||
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

          <Accordion type="single" collapsible className="w-full">
            {helpContent.map((section) => (
              <HelpItem 
                key={section.id} 
                section={section}
                isFaded={searchTerm.length > 0 && !filteredIds.has(section.id)}
              />
            ))}
          </Accordion>

        </CardContent>
      </Card>
    </div>
  );
}
