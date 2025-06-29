
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedReapproProduit, Produit } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Search, PackagePlus, Save, Loader2, Minus, Plus, Truck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function NewReapproPage() {
    const { addReapprovisionnement, currentUser } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [source, setSource] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());

    const handleScan = async () => {
        if (!barcode.trim()) return;

        const addOrIncrementProduct = (product: Produit) => {
            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id);

            if (existingItemIndex > -1) {
                const newItems = [...scannedItems];
                newItems[existingItemIndex].qteAjoutee += 1;
                setScannedItems(newItems);
                toast({ title: "Quantité incrémentée", description: product.nom });
            } else {
                setScannedItems(prevItems => [
                    ...prevItems,
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        entrepotNom: product.entrepotNom || 'N/A',
                        qteAjoutee: 1,
                        barcode: product.codeBarre,
                    }
                ]);
                toast({ title: "Produit ajouté", description: product.nom });
            }
        };

        if (productCache.has(barcode)) {
            const cachedProduct = productCache.get(barcode)!;
            addOrIncrementProduct(cachedProduct);
            setBarcode("");
            return;
        }

        setIsScanning(true);
        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
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
                item.produitId === produitId ? { ...item, qteAjoutee: newQuantity } : item
            )
        );
    };

    const handleSave = async () => {
        if (scannedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Liste vide', description: "Veuillez scanner au moins un produit." });
            return;
        }
        if (!source.trim()) {
            toast({ variant: 'destructive', title: 'Source manquante', description: "Veuillez indiquer la source de l'approvisionnement." });
            return;
        }

        setIsSaving(true);
        const payload = {
            agent: currentUser?.email || "Utilisateur inconnu",
            source: source,
            lignes: scannedItems.map(({ nomProduit, barcode, ...item}) => ({...item}))
        };
        
        const newReappro = await addReapprovisionnement(payload);
        
        if (newReappro) {
            if (newReappro.id != null) {
                router.push(`/reapprovisionnements/${newReappro.id}`);
            } else {
                // Fallback if ID is not returned, go to list.
                router.push('/reapprovisionnements');
            }
        } else {
            // Error case, toast is handled by context. Just stop loading.
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Nouveau Réapprovisionnement</h1>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Truck /> Infos sur l'arrivage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="source">Source de l'approvisionnement</Label>
                                <Input id="source" placeholder="ex: Fournisseur A, Conteneur X" value={source} onChange={(e) => setSource(e.target.value)} disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agent">Agent responsable</Label>
                                <Input id="agent" value={currentUser?.email || "Utilisateur inconnu"} readOnly disabled />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
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
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><PackagePlus />Produits Ajoutés</CardTitle>
                            <CardDescription>Liste des produits à réapprovisionner.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Entrepôt</TableHead>
                                      <TableHead className="w-[150px] text-center">Quantité Ajoutée</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={item.produitId}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell>{item.entrepotNom}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.produitId, item.qteAjoutee - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                                <Input readOnly value={item.qteAjoutee} className="h-7 w-12 text-center p-0 border-0 bg-transparent focus-visible:ring-0" />
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.produitId, item.qteAjoutee + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                            </div>
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={3} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={scannedItems.length === 0 || !source.trim() || isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2" />} 
                                    {isSaving ? "Enregistrement..." : "Enregistrer le réapprovisionnement"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer l'arrivage ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action mettra à jour le stock pour {scannedItems.length} produit(s).
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSave}>Continuer</AlertDialogAction>
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

