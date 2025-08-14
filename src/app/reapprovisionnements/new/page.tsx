
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
import { ScanLine, Search, PackagePlus, Save, Loader2, Minus, Plus, Truck, Box, Package as UnitIcon, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewReapproPage() {
    const { addReapprovisionnement, currentUser } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [source, setSource] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());

    const handleScan = async () => {
        if (!barcode.trim()) return;

        const addOrUpdateProduct = (product: Produit) => {
             // Find stock location for this product
            const stockEntry = product.stocks?.[0]; // Default to the first stock location if multiple exist
            if (!stockEntry) {
                toast({ variant: 'destructive', title: 'Erreur', description: `Aucun lieu de stock trouvé pour ce produit.` });
                return;
            }

            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id && item.typeQuantite === scanType);

            if (existingItemIndex > -1) {
                const newItems = [...scannedItems];
                newItems[existingItemIndex].qteAjoutee += quantity;
                setScannedItems(newItems);
            } else {
                setScannedItems(prevItems => [
                    ...prevItems,
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        lieuStockNom: stockEntry.lieuStockNom,
                        qteAjoutee: quantity,
                        barcode: product.codeBarre,
                        typeQuantite: scanType,
                    }
                ]);
            }
            toast({ title: "Produit ajouté/mis à jour", description: `${quantity} x ${product.nom} (${scanType})` });
        };


        if (productCache.has(barcode)) {
            const cachedProduct = productCache.get(barcode)!;
            addOrUpdateProduct(cachedProduct);
            setBarcode("");
            setQuantity(1);
            return;
        }

        setIsScanning(true);
        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
                setProductCache(prevCache => new Map(prevCache).set(barcode, product));
                addOrUpdateProduct(product);
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Produit non trouvé.' });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
            toast({ variant: 'destructive', title: 'Erreur de scan', description: errorMessage });
        } finally {
            setIsScanning(false);
            setBarcode("");
            setQuantity(1);
        }
    };

    const handleRemoveItem = (produitId: number, type: 'UNITE' | 'CARTON') => {
        setScannedItems(currentItems => currentItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type)));
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
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="barcode">Code-barres</Label>
                                <Input
                                    id="barcode"
                                    placeholder="Entrez un code-barres..."
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                    disabled={isScanning || isSaving}
                                />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantité</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        min="1"
                                        disabled={isScanning || isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scanType">Type</Label>
                                    <Select value={scanType} onValueChange={(value: 'UNITE' | 'CARTON') => setScanType(value)} disabled={isScanning || isSaving}>
                                        <SelectTrigger id="scanType">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNITE">Unité</SelectItem>
                                            <SelectItem value="CARTON">Carton</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={handleScan} disabled={!barcode || isScanning || isSaving || quantity < 1} className="w-full">
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                            </Button>
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
                                      <TableHead>Lieu de Stock</TableHead>
                                      <TableHead className="w-[180px] text-center">Quantité Ajoutée</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={`${item.produitId}-${item.typeQuantite}`}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell>{item.lieuStockNom}</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            <div className="flex items-center justify-center gap-2">
                                                {item.typeQuantite === 'CARTON' ? <Box className="h-4 w-4" /> : <UnitIcon className="h-4 w-4" />}
                                                {item.qteAjoutee} {item.typeQuantite}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantite)} disabled={isSaving}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>
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
