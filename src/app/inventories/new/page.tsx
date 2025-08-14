
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedProduit, Produit, InventairePayload, InventaireBrouillon, InventaireBrouillonPayload, InventaireLignePayload } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, FileDown, ClipboardPaste } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

function JSONImportDialog({ onImport, onOpenChange }: { onImport: (jsonString: string) => void, onOpenChange: (open: boolean) => void }) {
    const [jsonString, setJsonString] = useState('');
    
    const handleImport = () => {
        onImport(jsonString);
        onOpenChange(false);
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Coller le JSON de l'inventaire</DialogTitle>
                <DialogDescription>Collez le contenu JSON (objet avec une clé "lignes") pour charger les produits.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea
                    placeholder='Collez votre JSON ici...'
                    value={jsonString}
                    onChange={(e) => setJsonString(e.target.value)}
                    className="min-h-[200px] font-mono text-xs"
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                <Button onClick={handleImport} disabled={!jsonString}>Charger les données</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function NewInventoryPage() {
    const { createInventaire, updateInventaire, currentUser, produits, lieuxStock, stocks } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [mode, setMode] = useState<'new' | 'edit_draft' | 'edit_final'>('new');
    const [pageIsLoading, setPageIsLoading] = useState(true);

    const [activeDraft, setActiveDraft] = useState<InventaireBrouillon | null>(null);
    const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);

    const [scannedItems, setScannedItems] = useState<ScannedProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());
    const [isFirstInventory, setIsFirstInventory] = useState(false);
    const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

    const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);
    const lieuStockMap = useMemo(() => new Map(lieuxStock.map(l => [l.nom, l.id])), [lieuxStock]);

    useEffect(() => {
        const draftId = searchParams.get('draft');
        const editId = searchParams.get('edit');
        
        const loadData = async () => {
            setPageIsLoading(true);
            try {
                if (editId) {
                    setMode('edit_final');
                    const id = Number(editId);
                    setEditingInventoryId(id);
                    const inventoryData = await api.getInventaire(id);
                    if (!inventoryData) throw new Error("Inventaire non trouvé.");
                    if(inventoryData.lignes) {
                        const items: ScannedProduit[] = inventoryData.lignes.map((ligne: any) => ({
                            produitId: ligne.produitId,
                            nomProduit: ligne.nomProduit,
                            refProduit: productMap.get(ligne.produitId)?.ref || 'N/A',
                            lieuStockNom: ligne.lieuStockNom,
                            qteScanne: ligne.qteScanneTotaleUnites,
                            barcode: 'N/A',
                            typeQuantiteScanne: 'UNITE',
                        }));
                        setScannedItems(items.reverse());
                    }
                    toast({ title: `Modification de l'inventaire N°${editId}` });
                } else if (draftId) {
                    const draft = await api.getInventaireBrouillon(Number(draftId));
                    if (draft) {
                        setMode('edit_draft');
                        setActiveDraft(draft);
                        if (draft.lignes) {
                             const items: ScannedProduit[] = draft.lignes.map(l => ({
                                produitId: l.produitId,
                                nomProduit: l.produitNom,
                                lieuStockNom: l.lieuStockNom,
                                qteScanne: l.qteScanne,
                                typeQuantiteScanne: l.typeQuantiteScanne as 'UNITE' | 'CARTON',
                                barcode: 'N/A', // Not available in draft lines
                                refProduit: productMap.get(l.produitId)?.ref || 'N/A'
                            }));
                            setScannedItems(items);
                        }
                        if(searchParams.get('loaded') !== 'true') {
                            toast({ title: `Brouillon #${draft.id} chargé.` });
                            router.replace(`/inventories/new?draft=${draftId}&loaded=true`, { scroll: false });
                        }
                    } else {
                         router.push('/inventories/new');
                    }
                } else {
                    setMode('new');
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.' });
                router.push('/inventories');
            } finally {
                setPageIsLoading(false);
            }
        };

        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, productMap]);

    const handleScan = async () => {
        if (!barcode.trim() || !currentUser) return;

        if (!currentUser.lieuNom) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Aucun lieu de stock n'est assigné à votre compte." });
            return;
        }

        const addOrUpdateProduct = (product: Produit) => {
            const lieuStockNom = currentUser.lieuNom;
            if (!lieuStockNom) {
                toast({ variant: 'destructive', title: 'Erreur', description: `Aucun lieu de stock n'est défini pour votre utilisateur.` });
                return;
            }

            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id && item.typeQuantiteScanne === scanType);
            let newItems;

            if (existingItemIndex > -1) {
                const updatedItem = {
                    ...scannedItems[existingItemIndex],
                    qteScanne: scannedItems[existingItemIndex].qteScanne + quantity
                };
                newItems = [
                    updatedItem,
                    ...scannedItems.slice(0, existingItemIndex),
                    ...scannedItems.slice(existingItemIndex + 1)
                ];
            } else {
                newItems = [
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        refProduit: product.ref,
                        lieuStockNom: lieuStockNom, 
                        qteScanne: quantity,
                        barcode: product.codeBarre,
                        typeQuantiteScanne: scanType,
                    },
                    ...scannedItems,
                ];
            }
            setScannedItems(newItems);
            
            toast({ 
                title: "Produit ajouté", 
                description: `${quantity} x ${product.nom} (${scanType})` 
            });
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
        const newItems = scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantiteScanne === type));
        setScannedItems(newItems);
    };
    
    const handleSaveDraft = async () => {
        if (scannedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Brouillon vide', description: 'Ajoutez au moins un produit avant de sauvegarder.' });
            return;
        }
        if (mode === 'edit_final') {
            toast({ variant: 'destructive', title: 'Action impossible', description: 'Vous ne pouvez pas sauvegarder un inventaire finalisé comme brouillon.'});
            return;
        }
        if (!currentUser || !currentUser.email) {
             toast({ variant: 'destructive', title: 'Action impossible', description: 'Utilisateur non identifié.'});
            return;
        }
        setIsSaving(true);
        
        const payload: InventaireBrouillonPayload = {
            charge: currentUser.email,
            produits: scannedItems.map(item => ({
                produitId: item.produitId,
                ref: item.refProduit,
                qteScanne: item.qteScanne,
                lieuStockNom: item.lieuStockNom,
                typeQuantiteScanne: item.typeQuantiteScanne,
            }))
        };
        
        try {
            if (activeDraft?.id) {
                const updatedDraft = await api.updateInventaireBrouillon(activeDraft.id, payload);
                setActiveDraft(updatedDraft);
                toast({ title: "Brouillon mis à jour", description: `Le brouillon #${updatedDraft.id} a été sauvegardé.` });
            } else {
                const newDraft = await api.createInventaireBrouillon(payload);
                setActiveDraft(newDraft);
                router.replace(`/inventories/new?draft=${newDraft.id}&loaded=true`, { scroll: false });
                toast({ 
                    title: "Brouillon sauvegardé", 
                    description: `Le brouillon #${newDraft.id} a été créé.` 
                });
            }
        } catch (error) {
            // error handled by context
        } finally {
            setIsSaving(false);
        }
    };

    const handleCalculateInventory = async () => {
        if (scannedItems.length === 0) {
            toast({ variant: "destructive", title: "Inventaire vide", description: "Veuillez scanner au moins un produit." });
            return;
        }
        if (!currentUser || !currentUser.email) {
            toast({ variant: "destructive", title: "Utilisateur non identifié", description: "Impossible de continuer sans être connecté." });
            return;
        }

        setIsSaving(true);
        
        const firstLieuStockNom = scannedItems[0]?.lieuStockNom;
        if (!firstLieuStockNom) {
            toast({ variant: "destructive", title: "Erreur de lieu de stock", description: "Impossible de déterminer le lieu de stock pour cet inventaire." });
            setIsSaving(false);
            return;
        }

        const globalLieuStockId = lieuStockMap.get(firstLieuStockNom);
        if (!globalLieuStockId) {
            toast({ variant: "destructive", title: "Erreur de lieu de stock", description: `Lieu de stock '${firstLieuStockNom}' invalide.` });
            setIsSaving(false);
            return;
        }

        const payloadLignes: InventaireLignePayload[] = scannedItems.map(item => {
            const lieuStockId = lieuStockMap.get(item.lieuStockNom);
            if (!lieuStockId) {
                throw new Error(`Lieu de stock non trouvé pour ${item.lieuStockNom}`);
            }
            return {
                produitId: item.produitId,
                qteScanne: item.qteScanne,
                lieuStockId: lieuStockId,
                typeQuantiteScanne: item.typeQuantiteScanne,
                ref: item.refProduit,
            };
        });

        const payload: InventairePayload = {
            charge: currentUser.email,
            lieuStockId: globalLieuStockId,
            produits: payloadLignes,
        };
        
        try {
            let resultInventory = null;
            if (mode === 'edit_final' && editingInventoryId) {
                resultInventory = await updateInventaire(editingInventoryId, payload);
            } else {
                resultInventory = await createInventaire(payload, isFirstInventory);
            }
            
            if (resultInventory && resultInventory.id) {
                if(activeDraft?.id) {
                    await api.deleteInventaireBrouillon(activeDraft.id);
                }
                router.push(`/inventories/${resultInventory.id}`);
            } else {
                 setIsSaving(false);
            }
        } catch (error) {
            setIsSaving(false);
        }
    };
    
    const handleJsonImport = (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.lignes || !Array.isArray(data.lignes)) {
                throw new Error("Le JSON doit contenir une clé 'lignes' avec un tableau de produits.");
            }

            const newItems: ScannedProduit[] = data.lignes.map((ligne: any) => {
                if (!ligne.produitId || !ligne.nomProduit || typeof ligne.qteScanneTotaleUnites === 'undefined') {
                    console.warn("Ligne JSON ignorée (champs manquants):", ligne);
                    return null;
                }
                return {
                    produitId: ligne.produitId,
                    nomProduit: ligne.nomProduit,
                    refProduit: productMap.get(ligne.produitId)?.ref || 'N/A',
                    lieuStockNom: ligne.lieuStockNom || 'N/A',
                    qteScanne: ligne.qteScanneTotaleUnites,
                    barcode: 'N/A', // Not available in this format
                    typeQuantiteScanne: 'UNITE', // Import all as units for simplicity
                };
            }).filter(Boolean);

            setScannedItems(newItems);
            toast({ title: 'Importation JSON réussie', description: `${newItems.length} produits chargés dans le panier.` });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse du JSON.";
            toast({ variant: 'destructive', title: "Erreur d'importation JSON", description: errorMessage });
        }
    };
    
    const pageTitle = useMemo(() => {
        if (mode === 'edit_final') return `Modifier l'Inventaire N°${editingInventoryId}`;
        if (activeDraft) return `Brouillon #${activeDraft.id}`;
        return "Nouvel Inventaire";
    }, [mode, editingInventoryId, activeDraft]);


    if(pageIsLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-8 md:grid-cols-3">
                    <Skeleton className="h-64 md:col-span-1" />
                    <Skeleton className="h-96 md:col-span-2" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">{pageTitle}</h1>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                            <CardDescription>Entrez ou scannez un code-barres pour l'ajouter à l'inventaire.</CardDescription>
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
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter à l\'inventaire'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><UnitIcon />Produits Scannés</CardTitle>
                            <CardDescription>
                                Liste des produits comptabilisés dans cet inventaire.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Référence</TableHead>
                                      <TableHead>Lieu</TableHead>
                                      <TableHead className="w-[180px] text-center">Quantité Scannée</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={`${item.produitId}-${item.typeQuantiteScanne}`}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.refProduit}</TableCell>
                                        <TableCell>{item.lieuStockNom}</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            <div className="flex items-center justify-center gap-2">
                                                {item.typeQuantiteScanne === 'CARTON' ? <Box className="h-4 w-4" /> : <UnitIcon className="h-4 w-4" />}
                                                {item.qteScanne} {item.typeQuantiteScanne === 'UNITE' && item.qteScanne > 1 ? 'Unités' : item.typeQuantiteScanne}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantiteScanne)} disabled={isSaving}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit scanné.</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-between items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleSaveDraft} disabled={scannedItems.length === 0 || isSaving || mode === 'edit_final'}>
                                    <FileDown className="h-4 w-4 mr-2" />
                                    {isSaving ? "Sauvegarde..." : "Sauvegarder Brouillon"}
                                </Button>

                                <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" disabled={isSaving}>
                                            <ClipboardPaste className="h-4 w-4 mr-2" />
                                            Coller JSON
                                        </Button>
                                    </DialogTrigger>
                                    <JSONImportDialog onImport={handleJsonImport} onOpenChange={setIsJsonDialogOpen} />
                                </Dialog>
                            </div>

                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={scannedItems.length === 0 || isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Server className="h-4 w-4 mr-2" />} 
                                    {isSaving ? "Calcul en cours..." : "Calculer les écarts"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Calculer les écarts ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action soumettra la liste scannée pour calculer les écarts avec le stock théorique. Vous pourrez ensuite confirmer pour appliquer les changements.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex items-center space-x-2 py-2">
                                    <Checkbox id="isFirstInventory" checked={isFirstInventory} onCheckedChange={(checked) => setIsFirstInventory(!!checked)} disabled={mode === 'edit_final'} />
                                    <label
                                        htmlFor="isFirstInventory"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Ceci est le premier inventaire (réinitialise le stock)
                                    </label>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCalculateInventory}>Continuer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
