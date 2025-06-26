
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, Archive, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useApp } from "@/context/app-provider";
import type { Produit } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

function BarcodeScannerCard() {
    const { produits } = useApp();
    const [barcode, setBarcode] = useState("");
    const [scannedProduct, setScannedProduct] = useState<Produit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    const handleScan = () => {
        setError(null);
        setScannedProduct(null);
        setIsScanning(true);

        setTimeout(() => {
        const product = produits.find((p) => p.code_barre === barcode);
        if (product) {
            setScannedProduct(product);
        } else {
            setError("Produit non trouvé. Veuillez vérifier le code-barres ou ajouter le produit à votre stock.");
        }
        setIsScanning(false);
        setBarcode("");
        }, 500);
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ScanLine className="h-6 w-6" />
                    Scanner de Produit
                </CardTitle>
                <CardDescription>Entrez un code-barres pour trouver rapidement un produit.</CardDescription>
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
                </div>
                {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}
                {scannedProduct ? (
                <div className="space-y-4 pt-4 border-t">
                    <div>
                    <h3 className="text-xl font-bold font-headline text-primary">{scannedProduct.nom}</h3>
                    <p className="text-sm text-muted-foreground">#{scannedProduct.code_barre}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="text-sm text-muted-foreground">Prix de Vente</p>
                        <p className="font-semibold">{formatCurrency(scannedProduct.prix_vente)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="text-sm text-muted-foreground">En Stock</p>
                        <p className="font-semibold">{scannedProduct.quantite_stock}</p>
                        </div>
                    </div>
                    </div>
                </div>
                ) : !isScanning && (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Les détails du produit scanné apparaîtront ici.</p>
                </div>
                )}
            </CardContent>
        </Card>
    );
}


export default function DashboardPage() {
  const { produits, ventes, activeModules } = useApp();
  
  const totalProducts = produits.length;
  const outOfStockProducts = produits.filter(p => p.quantite_stock === 0).length;
  const lowStockProducts = produits.filter(p => p.quantite_stock > 0 && p.quantite_stock <= p.alerte_stock).length;
  const totalStockValue = produits.reduce((acc, p) => acc + (p.prix_vente * p.quantite_stock), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Tableau de Bord</h1>
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
            <div className="text-2xl font-bold">{ventes.length}</div>
            <p className="text-xs text-muted-foreground">Nombre total de transactions</p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {activeModules.barcode && <BarcodeScannerCard />}
         <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle className="font-headline">Activité Récente</CardTitle>
                <CardDescription>Dernières ventes enregistrées.</CardDescription>
             </CardHeader>
             <CardContent>
                 {ventes.slice(0, 5).map(vente => (
                     <div key={vente.id} className="flex items-center justify-between py-2 border-b last:border-none">
                         <div>
                             <p className="font-medium">{vente.client}</p>
                             <p className="text-xs text-muted-foreground">{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</p>
                         </div>
                         <div className="font-semibold">{formatCurrency(vente.montant_total)}</div>
                     </div>
                 ))}
                 {ventes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
