
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, Archive, TrendingUp, AlertCircle, History, Building2, Eye } from "lucide-react";
import { useApp } from "@/context/app-provider";
import type { Produit, Facture } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import * as api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function BarcodeScannerCard() {
    const [barcode, setBarcode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const router = useRouter();
    const { setScannedProductDetails } = useApp();

    const handleScan = async () => {
        if (!barcode.trim()) return;
        setError(null);
        setIsScanning(true);

        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
                setScannedProductDetails(product);
                router.push(`/products/${product.id}`);
            } else {
                setError("Produit non trouvé. Veuillez vérifier le code-barres.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors de la recherche.";
            setError(errorMessage);
        } finally {
            setIsScanning(false);
            setBarcode("");
        }
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ScanLine className="h-6 w-6" />
                    Scanner de Produit
                </CardTitle>
                <CardDescription>Entrez un code-barres pour trouver et afficher les détails d'un produit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="barcode">Code-barres</Label>
                    <div className="flex space-x-2">
                        <Input
                        id="barcode"
                        placeholder="Entrez ou scannez un code-barres..."
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        disabled={isScanning}
                        />
                        <Button onClick={handleScan} disabled={!barcode || isScanning}>
                         {isScanning ? 'Scan...' : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Si les caractères scannés sont incorrects, vérifiez que la langue de votre lecteur (ex: AZERTY/QWERTY) correspond à celle de votre clavier.
                    </p>
                </div>
                {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Scannez un code-barres pour être redirigé vers sa page de détails.</p>
                </div>
            </CardContent>
        </Card>
    );
}

function StockLocationStats() {
  const { lieuxStock, stocks, produits, isMounted } = useApp();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const locationStats = useMemo(() => {
    if (!isMounted || !lieuxStock.length || !stocks.length || !produits.length) {
        return [];
    }
  
    const productMap = new Map(produits.map(p => [p.id, p]));
  
    return lieuxStock.map(lieu => {
        const locationStocks = stocks.filter(stock => stock.lieuStockNom === lieu.nom);
        
        const stockValue = locationStocks.reduce((sum, stock) => {
            const product = produits.find(p => p.id === stock.produitId);
            if (!product || !product.prix) {
                return sum;
            }
            return sum + (stock.quantiteTotale * product.prix);
        }, 0);
        
        const lowStockCount = locationStocks.filter(stock => {
            const product = produits.find(p => p.id === stock.produitId);
            if (!product) return false;
            
            return stock.quantiteTotale > 0 && stock.quantiteTotale <= (product.qteMin || 0);
        }).length;
  
        return {
            ...lieu,
            uniqueProducts: locationStocks.length,
            stockValue,
            lowStockCount
        };
    });
  }, [lieuxStock, stocks, produits, isMounted]);

  if (!isMounted) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                      <Card key={i}>
                          <CardHeader>
                              <Skeleton className="h-6 w-32" />
                          </CardHeader>
                          <CardContent className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                          </CardContent>
                          <CardFooter>
                              <Skeleton className="h-8 w-24" />
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          </div>
      );
  }
  
  if (!locationStats.length) {
      return null;
  }

  return (
      <div className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold">Performance par Lieu de Stock</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locationStats.map(lieu => (
                  <Card key={lieu.id}>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl font-headline">
                              <Building2 className="h-5 w-5"/>
                              {lieu.nom}
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                         <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Valeur du stock</span>
                              <span className="font-semibold">{formatCurrency(lieu.stockValue)}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Produits uniques</span>
                              <span className="font-semibold">{lieu.uniqueProducts}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Alertes stock faible</span>
                              <span className={cn("font-semibold", lieu.lowStockCount > 0 ? "text-orange-500" : "text-green-600")}>
                                  {lieu.lowStockCount}
                              </span>
                         </div>
                      </CardContent>
                      <CardFooter>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/stock?lieu=${lieu.nom}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                          </Button>
                      </CardFooter>
                  </Card>
              ))}
          </div>
      </div>
  );
}

export function AdminDashboard() {
  const { produits, factures } = useApp();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const totalProducts = produits.length;
  const outOfStockProducts = produits.filter(p => (p.quantiteTotaleGlobale ?? 0) === 0).length;
  const lowStockProducts = produits.filter(p => (p.quantiteTotaleGlobale ?? 0) > 0 && (p.quantiteTotaleGlobale ?? 0) <= p.qteMin).length;
  const totalStockValue = produits.reduce((acc, p) => acc + ((p.prix || 0) * (p.quantiteTotaleGlobale || 0)), 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Tableau de Bord Administrateur</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale du Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">{totalProducts} produits uniques en stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des Ventes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factures.length}</div>
            <p className="text-xs text-muted-foreground">Nombre total de factures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes de Stock Faible</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Hors Stock</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Produits en rupture de stock</p>
          </CardContent>
        </Card>
      </div>

      <StockLocationStats />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <BarcodeScannerCard />
         <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History />Activité Récente</CardTitle>
                <CardDescription>Dernières factures générées.</CardDescription>
             </CardHeader>
             <CardContent>
                 {factures.slice(0, 5).map(facture => (
                     <div key={facture.idFacture} className="flex items-center justify-between py-2 border-b last:border-none">
                         <div>
                             <p className="font-medium">{facture.clientNom}</p>
                             <p className="text-xs text-muted-foreground">{new Date(facture.dateFacture).toLocaleDateString('fr-FR')}</p>
                         </div>
                         <div className="font-semibold">{formatCurrency(facture.montantTotal)}</div>
                     </div>
                 ))}
                 {factures.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
