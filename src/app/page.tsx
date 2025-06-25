"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Search, Package, DollarSign, MoveRight } from "lucide-react";
import { useApp } from "@/context/app-provider";
import type { Product } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

export default function DashboardPage() {
  const { products } = useApp();
  const [barcode, setBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Tableau de Bord</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <ScanLine className="h-6 w-6" />
              Scanner de Code-barres
            </CardTitle>
            <CardDescription>Entrez un code-barres pour trouver rapidement un produit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative mx-auto w-full max-w-md h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-black/50">
                    <Image src="https://placehold.co/600x400.png" alt="Camera feed" layout="fill" objectFit="cover" className="opacity-20" data-ai-hint="barcode scanner" />
                </div>
               {isScanning && (
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute w-full h-1 bg-green-400/70 shadow-[0_0_10px_2px_#34D399] animate-scan-line"></div>
                </div>
               )}
              <ScanLine className="h-24 w-24 text-white/40" />
               <style jsx>{`
                @keyframes scan-line {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan-line {
                    animation: scan-line 2s ease-in-out infinite;
                }
            `}</style>
            </div>
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
                  {isScanning ? 'Scan en cours...' : <><Search className="mr-2 h-4 w-4" /> Scanner</>}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Cet outil simule un scanner de code-barres pour une recherche rapide de produits.</p>
          </CardFooter>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Détails du Produit</CardTitle>
            <CardDescription>Les informations du produit scanné apparaîtront ici.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {scannedProduct ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold font-headline text-primary">{scannedProduct.name}</h3>
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
                <Button className="w-full">
                  Ajouter à la facture <MoveRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                <Package className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Scannez un produit pour voir ses détails</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
