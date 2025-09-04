
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, Archive, AlertCircle, Warehouse } from "lucide-react";
import { useApp } from "@/context/app-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ScanLine className="h-6 w-6" />
                    Scanner un Produit
                </CardTitle>
                <CardDescription>Entrez un code-barres pour voir les détails d'un produit.</CardDescription>
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
            </CardContent>
        </Card>
    );
}

export function MagasinierDashboard() {
  const { stocks, produits, currentUser } = useApp();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const localData = useMemo(() => {
    if (!currentUser?.lieuNom) {
        return {
            stockValue: 0,
            uniqueProducts: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            lowStockProducts: []
        };
    }
    
    const localStocks = stocks.filter(s => s.lieuStockNom === currentUser.lieuNom);
    const productMap = new Map(produits.map(p => [p.id, p]));

    let stockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockProducts: { nom: string, stock: number, seuil: number }[] = [];

    localStocks.forEach(stock => {
        const product = productMap.get(stock.produitId);
        if (product) {
            const totalUnits = (stock.qteCartons || 0) * (product.qteParCarton || 1) + (stock.qteUnitesRestantes || 0);
            
            stockValue += (product.prix || 0) * totalUnits;
            
            if (totalUnits === 0) {
                outOfStockCount++;
            } else if (totalUnits <= (product.qteMin || 0)) {
                lowStockCount++;
                lowStockProducts.push({
                    nom: product.nom,
                    stock: totalUnits,
                    seuil: product.qteMin || 0
                });
            }
        }
    });

    return {
        stockValue,
        uniqueProducts: localStocks.length,
        lowStockCount,
        outOfStockCount,
        lowStockProducts
    };

  }, [stocks, produits, currentUser]);


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Tableau de Bord - {currentUser?.lieuNom}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur du Stock Local</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(localData.stockValue)}</div>
            <p className="text-xs text-muted-foreground">{localData.uniqueProducts} produits uniques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Uniques</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localData.uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">Références en stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localData.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Produits à surveiller</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupture de Stock</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localData.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Produits non disponibles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><AlertCircle />Alertes de Stock Faible</CardTitle>
                <CardDescription>Produits dont la quantité est inférieure ou égale au seuil.</CardDescription>
             </CardHeader>
             <CardContent>
                {localData.lowStockProducts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Seuil</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {localData.lowStockProducts.map((p, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{p.nom}</TableCell>
                                <TableCell className="text-right font-bold text-orange-500">{p.stock}</TableCell>
                                <TableCell className="text-right">{p.seuil}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun produit en stock faible. Excellent travail !</p>
                )}
             </CardContent>
         </Card>
         <BarcodeScannerCard />
      </div>
    </div>
  );
}
