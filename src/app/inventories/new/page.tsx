
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedProduit, Produit } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Search, Package, Save, Loader2, Minus, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';


export default function NewInventoryPage() {
    const { createInventaire, currentUser } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [scannedItems, setScannedItems] = useState<ScannedProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());
    const [isFirstInventory, setIsFirstInventory] = useState(false);

    const handleScan = async () => {
        if (!barcode.trim()) return;

        const addOrIncrementProduct = (product: Produit) => {
            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id);

            if (existingItemIndex > -1) {
                const newItems = [...scannedItems];
                newItems[existingItemIndex].qteScanne += 1;
                setScannedItems(newItems);
                toast({ title: "Quantité incrémentée", description: product.nom });
            } else {
                setScannedItems(prevItems => [
                    ...prevItems,
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        lieuStockNom: product.lieuStockNom || 'N/A',
                        qteScanne: 1,
                        barcode: product.codeBarre,
                    }
                ]);
                toast({ title: "Produit ajouté", description: product.nom });
            }
        };

        // Check cache first
        if (productCache.has(barcode)) {
            const cachedProduct = productCache.get(barcode)!;
            addOrIncrementProduct(cachedProduct);
            setBarcode("");
            return;
        }

        // If not in cache, make the API call
        setIsScanning(true);
        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
                // Add to cache for future scans
                setProductCache(prevCache => new Map(prevCache).set(barcode, product));
                addOrIncrementProduct(product);
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Produit non trouvé.' });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
            toast({ variant: 'destructive', title: 'Erreur de scan', description: errorMessage });
        } finally {
            setIsScanning(false);
            setBarcode("");
        }
    };

    const handleQuantityChange = (produitId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            setScannedItems(currentItems => currentItems.filter(item => item.produitId !== produitId));
            return;
        }
        setScannedItems(currentItems =>
            currentItems.map(item =>
                item.produitId === produitId ? { ...item, qteScanne: newQuantity } : item
            )
        );
    };

    const handleSaveInventory = async () => {
        if (scannedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Inventaire vide', description: "Veuillez scanner au moins un produit." });
            return;
        }

        setIsSaving(true);
        const payload = {
            charge: currentUser?.email || "Utilisateur inconnu",
            produits: scannedItems.map(({ nomProduit, barcode, ...item}) => item)
        };
        
        const newInventory = await createInventaire(payload, isFirstInventory);
        
        if (newInventory) {
            router.push(`/inventories/${newInventory.inventaireId}`);
        } else {
            // Error toast is handled by the provider
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Nouvel Inventaire</h1>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                            <CardDescription>Entrez ou scannez un code-barres pour l'ajouter à l'inventaire.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2">
                                <Label htmlFor="barcode">Code-barres</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        id="barcode"
                                        placeholder="Entrez un code-barres..."
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                        disabled={isScanning || isSaving}
                                    />
                                    <Button onClick={handleScan} disabled={!barcode || isScanning || isSaving} size="icon">
                                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Le produit scanné sera ajouté ou incrémenté dans la liste.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Package />Produits Scannés</CardTitle>
                            <CardDescription>Liste des produits comptabilisés dans cet inventaire.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Lieu de Stock</TableHead>
                                      <TableHead className="w-[150px] text-center">Quantité Scannée</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={item.produitId}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell>{item.lieuStockNom}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.produitId, item.qteScanne - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                                <Input readOnly value={item.qteScanne} className="h-7 w-12 text-center p-0 border-0 bg-transparent focus-visible:ring-0" />
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.produitId, item.qteScanne + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                            </div>
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={3} className="h-24 text-center">Aucun produit scanné.</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={scannedItems.length === 0 || isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2" />} 
                                    {isSaving ? "Enregistrement..." : "Enregistrer l'inventaire"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer l'inventaire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action soumettra l'inventaire et mettra à jour les quantités en stock de {scannedItems.length} produit(s). Cette opération est irréversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex items-center space-x-2 py-2">
                                    <Checkbox id="isFirstInventory" checked={isFirstInventory} onCheckedChange={(checked) => setIsFirstInventory(!!checked)} />
                                    <label
                                        htmlFor="isFirstInventory"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Ceci est le premier inventaire (réinitialise le stock)
                                    </label>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSaveInventory}>Continuer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

    