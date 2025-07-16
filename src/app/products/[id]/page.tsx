
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, DollarSign, Tag, Barcode, AlertTriangle, Building2 as Warehouse } from 'lucide-react';
import type { Produit as ProduitType } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    produits, 
    isMounted, 
    scannedProductDetails, 
    setScannedProductDetails 
  } = useApp();
  
  const [produit, setProduit] = useState<ProduitType | null | undefined>(undefined);

  useEffect(() => {
    // Use fresh data from scan if available
    if (scannedProductDetails && scannedProductDetails.id === Number(id)) {
      setProduit(scannedProductDetails);
      setScannedProductDetails(null); // Clear after use
    } 
    // Fallback for direct navigation/refresh
    else if (isMounted && id) {
      const foundProduit = produits.find(p => p.id === Number(id));
      setProduit(foundProduit);
    }
  }, [id, produits, isMounted, scannedProductDetails, setScannedProductDetails]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  if (produit === undefined || !isMounted) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
             <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-32" />
           </CardFooter>
        </Card>
      </div>
    );
  }

  if (produit === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-8">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Produit non trouvé</h2>
        <p className="text-muted-foreground">Le produit que vous cherchez n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/stock')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retourner au stock
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Détails du Produit
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{produit.nom}</CardTitle>
          <CardDescription>Référence: {produit.ref}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 text-base">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><Package className="h-5 w-5"/>Quantité en stock</span>
              <span className="font-semibold">{produit.qte}</span>
            </div>
             <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-5 w-5"/>Prix de vente</span>
              <span className="font-semibold">{formatCurrency(produit.prix)}</span>
            </div>
             <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-5 w-5"/>Seuil d'alerte</span>
              <span className="font-semibold">{produit.qteMin}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-5 w-5"/>Catégorie</span>
              <Badge variant="secondary">{produit.categorieNom || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
               <span className="text-muted-foreground flex items-center gap-2"><Warehouse className="h-5 w-5"/>Lieu de Stock</span>
              <Badge variant="secondary">{produit.lieuStockNom || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2 col-span-full">
               <span className="text-muted-foreground flex items-center gap-2"><Barcode className="h-5 w-5"/>Code-barres</span>
               <span className="font-mono text-sm">{produit.codeBarre}</span>
            </div>
          </div>
          {produit.qte <= produit.qteMin && (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerte de stock faible</AlertTitle>
                <AlertDescription>
                  La quantité en stock est inférieure ou égale au seuil d'alerte.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/stock')}>
                Retourner à la liste du stock
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
