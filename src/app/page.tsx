
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, Archive, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useApp } from "@/context/app-provider";
import type { Produit } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import * as api from "@/lib/api";

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


export default function DashboardPage() {
  const { produits, ventes, activeModules } = useApp();
  
  const totalProducts = produits.length;
  const outOfStockProducts = produits.filter(p => p.qte === 0).length;
  const lowStockProducts = produits.filter(p => p.qte > 0 && p.qte <= p.qteMin).length;
  const totalStockValue = produits.reduce((acc, p) => acc + (p.prix * p.qte), 0);

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
                             <p className="text-xs text-muted-foreground">{new Date(vente.date).toLocaleDateString('fr-FR')}</p>
                         </div>
                         <div className="font-semibold">{formatCurrency(vente.paiement)}</div>
                     </div>
                 ))}
                 {ventes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
