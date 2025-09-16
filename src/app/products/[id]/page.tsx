
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, DollarSign, Tag, Barcode, AlertTriangle, Building2 as Warehouse, Boxes } from 'lucide-react';
import type { Produit as ProduitType, Stock } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    produits, 
    stocks,
    isMounted, 
    scannedProductDetails, 
    setScannedProductDetails 
  } = useApp();
  const { toast } = useToast();
  
  const [produit, setProduit] = useState<ProduitType | null | undefined>(undefined);

  const fetchProduct = useCallback(async (productId: number) => {
    try {
        const data = await api.getProductById(productId);
        const productStocks = await api.getStocks();
        const relatedStocks = productStocks.filter((s: Stock) => s.produitId === data.id);
        setProduit({ ...data, stocks: relatedStocks });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur de chargement",
            description: "Le produit n'a pas pu être chargé depuis le serveur."
        });
        setProduit(null);
    }
  }, [toast]);


  useEffect(() => {
    const productId = Number(id);
    if (!isMounted || isNaN(productId)) return;

    if (scannedProductDetails && scannedProductDetails.id === productId) {
        setProduit(scannedProductDetails);
        setScannedProductDetails(null);
    } else {
        const foundProduit = produits.find(p => p.id === productId);
        if (foundProduit) {
            const productStocks = stocks.filter(s => s.produitId === foundProduit.id);
            setProduit({ ...foundProduit, stocks: productStocks });
        } else {
            // If not found in context, fetch from API
            fetchProduct(productId);
        }
    }
}, [id, produits, stocks, isMounted, scannedProductDetails, setScannedProductDetails, fetchProduct]);


  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const totalStock = produit?.stocks?.reduce((sum, s) => sum + s.quantiteTotale, 0) ?? 0;

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
        <Alert variant="destructive" className="max-w-lg text-center">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Produit non trouvé</AlertTitle>
            <AlertDescription>
                Le produit que vous cherchez n'existe pas ou a été supprimé.
            </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retourner aux produits
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
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 text-base">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-5 w-5"/>Prix de vente</span>
              <span className="font-semibold">{formatCurrency(produit.prix)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-5 w-5"/>Prix Carton</span>
              <span className="font-semibold">{formatCurrency(produit.prixCarton)}</span>
            </div>
             <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><Boxes className="h-5 w-5"/>Unités / Carton</span>
              <span className="font-semibold">{produit.qteParCarton ?? 0}</span>
            </div>
             <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-5 w-5"/>Seuil d'alerte global</span>
              <span className="font-semibold">{produit.qteMin ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-5 w-5"/>Catégorie</span>
              <Badge variant="secondary">{produit.categorieNom || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2 col-span-full">
               <span className="text-muted-foreground flex items-center gap-2"><Barcode className="h-5 w-5"/>Code-barres</span>
               <span className="font-mono text-sm">{produit.codeBarre}</span>
            </div>
          </div>

          <div>
             <h3 className="font-headline text-xl mb-4">Répartition du Stock ({totalStock} unités au total)</h3>
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Warehouse className="inline h-4 w-4 mr-2"/>Lieu de Stock</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {produit.stocks && produit.stocks.length > 0 ? (
                            produit.stocks.map(stock => (
                                <TableRow key={stock.id}>
                                    <TableCell className="font-medium">{stock.lieuStockNom}</TableCell>
                                    <TableCell className="text-right font-semibold">{stock.quantiteTotale}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                    Ce produit n'est actuellement dans aucun lieu de stock.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
          </div>
          {(totalStock) <= (produit.qteMin ?? 0) && (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerte de stock faible</AlertTitle>
                <AlertDescription>
                  La quantité totale en stock est inférieure ou égale au seuil d'alerte global.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/products')}>
                Retourner à la liste des produits
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
