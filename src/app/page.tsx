
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, Archive, FileText } from "lucide-react";
import { useApp } from "@/context/app-provider";
import type { Product } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

function BarcodeScannerCard() {
    const { products } = useApp();
    const [barcode, setBarcode] = useState("");
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
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
        const product = products.find((p) => p.barcode === barcode);
        if (product) {
            setScannedProduct(product);
        } else {
            setError("Produit non trouvé. Veuillez vérifier le code-barres ou ajouter le produit à votre stock.");
        }
        setIsScanning(false);
        setBarcode("");
        }, 1000);
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
                        {isScanning ? 'Scan...' : <Search className="mr-2 h-4 w-4" />}
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
                    <h3 className="text-xl font-bold font-headline text-primary">{scannedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">#{scannedProduct.barcode}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="text-sm text-muted-foreground">Prix</p>
                        <p className="font-semibold">{formatCurrency(scannedProduct.price)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="text-sm text-muted-foreground">En Stock</p>
                        <p className="font-semibold">{scannedProduct.quantity} unités</p>
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
  const { products, invoices, activeModules } = useApp();
  
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const recentInvoices = invoices.filter(inv => new Date(inv.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

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
            <p className="text-xs text-muted-foreground">{totalProducts} produits uniques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures (7 derniers jours)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{recentInvoices}</div>
            <p className="text-xs text-muted-foreground">Total de {invoices.length} factures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Types de produits différents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Hors Stock</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Nécessitent un réapprovisionnement</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {activeModules.barcode && <BarcodeScannerCard />}
         <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle className="font-headline">Activité Récente</CardTitle>
                <CardDescription>Dernières factures enregistrées.</CardDescription>
             </CardHeader>
             <CardContent>
                 {invoices.slice(0, 5).map(invoice => (
                     <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-none">
                         <div>
                             <p className="font-medium">{invoice.customerName}</p>
                             <p className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
                         </div>
                         <div className="font-semibold">{formatCurrency(invoice.total)}</div>
                     </div>
                 ))}
                 {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
