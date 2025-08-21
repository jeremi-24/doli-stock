
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedReapproProduit, Produit, InventairePayload, InventaireLignePayload } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, ClipboardPaste, Building2, Minus, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type Draft = {
    timestamp: number;
    scannedItems: ScannedReapproProduit[];
    selectedLieuStockId: string | undefined;
    source: string;
};

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
                <DialogDescription>Collez le contenu JSON pour charger les produits.</DialogDescription>
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

    const [mode, setMode] = useState<'new' | 'edit_final'>('new');
    const [pageIsLoading, setPageIsLoading] = useState(true);

    const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);

    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());
    const [isFirstInventory, setIsFirstInventory] = useState(false);
    const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
    const [selectedLieuStockId, setSelectedLieuStockId] = useState<string | undefined>(undefined);
    const [source, setSource] = useState(""); // Re-ajout du champ source
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);
    const lieuStockMap = useMemo(() => new Map(lieuxStock.map(l => [l.id, l])), [lieuxStock]);

    const isAdmin = useMemo(() => pageIsLoading ? false : currentUser?.roleNom === 'ADMIN', [currentUser, pageIsLoading]);
    
    // --- Brouillon Logique ---
    const draftKey = useMemo(() => {
        if (pageIsLoading || !currentUser || !selectedLieuStockId) return null;
        return `inventory_draft_${currentUser.id}_${selectedLieuStockId}_${editingInventoryId || 'new'}`;
    }, [currentUser, selectedLieuStockId, editingInventoryId, pageIsLoading]);

    const saveDraft = useCallback(() => {
        if (!draftKey) return;
        const draft: Draft = {
            timestamp: Date.now(),
            scannedItems,
            selectedLieuStockId,
            source,
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [draftKey, scannedItems, selectedLieuStockId, source]);
    
    const clearDraft = useCallback(() => {
        if (draftKey) {
            localStorage.removeItem(draftKey);
        }
    }, [draftKey]);

    useEffect(() => {
        if (pageIsLoading) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (scannedItems.length > 0 || source) {
            saveTimeoutRef.current = setTimeout(saveDraft, 1000);
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [scannedItems, source, saveDraft, pageIsLoading]);

    // Save on exit
    useEffect(() => {
        if (pageIsLoading) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (scannedItems.length > 0) {
                saveDraft();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [scannedItems, saveDraft, pageIsLoading]);

    // Restore draft logic
    useEffect(() => {
        if (!pageIsLoading && draftKey && scannedItems.length === 0) {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const draft: Draft = JSON.parse(savedDraft);
                    const now = Date.now();
                    // Restore if draft is less than 24 hours old
                    if (now - draft.timestamp < 24 * 60 * 60 * 1000) {
                        toast({
                            title: "Brouillon trouvé",
                            description: `Un inventaire non terminé a été trouvé pour ce lieu.`,
                            action: (
                                <>
                                    <Button variant="secondary" size="sm" onClick={() => { setScannedItems(draft.scannedItems); setSource(draft.source || ""); toast({title: "Brouillon restauré."})}}>Restaurer</Button>
                                    <Button variant="destructive" size="sm" onClick={clearDraft}>Ignorer</Button>
                                </>
                            )
                        })
                    } else {
                        clearDraft();
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                    clearDraft();
                }
            }
        }
    }, [pageIsLoading, draftKey, toast, clearDraft, scannedItems.length]);
    // --- Fin Brouillon Logique ---
    
    useEffect(() => {
        const lieu = selectedLieuStockId ? lieuStockMap.get(Number(selectedLieuStockId)) : null;
        if (lieu) {
            document.title = `Inventaire - ${lieu.nom} - STA`;
        } else {
            document.title = `Nouvel Inventaire - STA`;
        }
    }, [selectedLieuStockId, lieuStockMap]);
    
    useEffect(() => {
      if (currentUser) {
        setPageIsLoading(false);
      }
    }, [currentUser]);

    useEffect(() => {
        if (pageIsLoading) return;
        
        if (!isAdmin && currentUser?.lieuId) {
            setSelectedLieuStockId(String(currentUser.lieuId));
        }

        const editId = searchParams.get('edit');
        const loadData = async () => {
            try {
                if (editId) {
                    setMode('edit_final');
                    const id = Number(editId);
                    setEditingInventoryId(id);
                    const inventoryData = await api.getInventaire(id);
                    if (!inventoryData) throw new Error("Inventaire non trouvé.");
                    if(inventoryData.lignes) {
                        const items: ScannedReapproProduit[] = inventoryData.lignes.map((ligne: any) => ({
                            produitId: ligne.produitId,
                            nomProduit: ligne.nomProduit,
                            lieuStockNom: ligne.lieuStockNom,
                            qteAjoutee: ligne.qteScanneTotaleUnites, // Map qteScanne to qteAjoutee
                            barcode: 'N/A',
                            typeQuantite: 'UNITE',
                        }));
                        setScannedItems(items.reverse());
                    }
                     if(inventoryData.lieuStockId) setSelectedLieuStockId(String(inventoryData.lieuStockId));
                    toast({ title: `Modification de l'inventaire N°${editId}` });
                } else {
                    setMode('new');
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données pour modification.' });
                router.push('/inventories');
            }
        };

        if(editId) {
            loadData();
        }
    }, [searchParams, productMap, currentUser, router, toast, isAdmin, pageIsLoading]);


    const handleScan = async () => {
        if (!barcode.trim() || !currentUser || !selectedLieuStockId) return;

        const lieuStock = lieuStockMap.get(Number(selectedLieuStockId));
        if (!lieuStock) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Le lieu de stock sélectionné est invalide." });
            return;
        }

        const addOrUpdateProduct = (product: Produit) => {
            const lieuStockNom = lieuStock.nom;
            
            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id && item.typeQuantite === scanType);
            let newItems;

            if (existingItemIndex > -1) {
                newItems = [...scannedItems];
                newItems[existingItemIndex].qteAjoutee += quantity;
            } else {
                newItems = [
                    ...scannedItems,
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        lieuStockNom: lieuStockNom, 
                        qteAjoutee: quantity,
                        barcode: product.codeBarre,
                        typeQuantite: scanType,
                    },
                ];
            }
            setScannedItems(newItems.sort((a, b) => b.produitId - a.produitId));
            
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
    
    const handleQuantityChange = (produitId: number, type: 'UNITE' | 'CARTON', newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(produitId, type);
            return;
        }

        setScannedItems(currentCart =>
            currentCart.map(item =>
                item.produitId === produitId && item.typeQuantite === type
                    ? { ...item, qteAjoutee: newQuantity }
                    : item
            )
        );
    };

    const handleRemoveItem = (produitId: number, type: 'UNITE' | 'CARTON') => {
        const newItems = scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type));
        setScannedItems(newItems);
    };

    const handleClearCart = () => {
        setScannedItems([]);
        clearDraft();
        toast({ title: 'Panier vidé', description: 'Tous les produits scannés ont été retirés.' });
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
        if (!selectedLieuStockId) {
            toast({ variant: "destructive", title: "Erreur de lieu de stock", description: "Veuillez sélectionner un lieu de stock." });
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        
        const globalLieuStockId = Number(selectedLieuStockId);
        
        const payloadLignes: InventaireLignePayload[] = scannedItems.map(item => {
            const product = productMap.get(item.produitId);
            return {
                produitId: item.produitId,
                qteScanne: item.qteAjoutee,
                lieuStockId: globalLieuStockId,
                typeQuantiteScanne: item.typeQuantite,
                ref: product?.ref || 'N/A', // Assurez-vous que la ref est envoyée
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
                clearDraft();
                router.push(`/inventories/${resultInventory.id}`);
            } else {
                 setIsSaving(false);
            }
        } catch (error) {
            setIsSaving(false);
        }
    };
    
    const findProduitsInJson = (data: any): any[] | null => {
        if (Array.isArray(data)) {
            for (const item of data) {
                const result = findProduitsInJson(item);
                if (result) return result;
            }
        } else if (typeof data === 'object' && data !== null && 'produits' in data && Array.isArray(data.produits)) {
            return data.produits;
        }
        return null;
    };

    const handleJsonImport = (jsonString: string) => {
        if (!selectedLieuStockId) {
            toast({ variant: 'destructive', title: 'Action requise', description: "Veuillez d'abord sélectionner un lieu de stock." });
            return;
        }
        
        const lieuStockSelectionne = lieuStockMap.get(Number(selectedLieuStockId));
        if (!lieuStockSelectionne) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Le lieu de stock sélectionné est invalide." });
            return;
        }
    
        try {
            const parsedData = JSON.parse(jsonString);
            const importedProducts = findProduitsInJson(parsedData);
            
            if (!importedProducts) {
                throw new Error("Le format JSON est invalide ou la clé 'produits' est introuvable.");
            }
    
            const newItems: ScannedReapproProduit[] = [];
            let skippedCount = 0;
    
            importedProducts.forEach((ligne: any) => {
                if (typeof ligne.produitId === 'undefined' || typeof ligne.qteScanne === 'undefined') {
                    skippedCount++;
                    return;
                }
    
                const productDetails = productMap.get(ligne.produitId);
    
                const newItem: ScannedReapproProduit = {
                    produitId: ligne.produitId,
                    nomProduit: ligne.nomProduit || productDetails?.nom || `Produit ${ligne.produitId}`,
                    lieuStockNom: lieuStockSelectionne.nom,
                    qteAjoutee: Number(ligne.qteScanne),
                    barcode: ligne.barcode || productDetails?.codeBarre || 'N/A',
                    typeQuantite: ligne.typeQuantiteScanne || 'UNITE',
                };
    
                newItems.push(newItem);
            });
            
            setScannedItems(prevItems => [...newItems, ...prevItems]);
            
            toast({ 
                title: 'Importation JSON réussie', 
                description: `${newItems.length} produits ajoutés au panier${skippedCount > 0 ? ` (${skippedCount} lignes ignorées)` : ''}.` 
            });
    
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse du JSON.";
            toast({ variant: 'destructive', title: "Erreur d'importation JSON", description: errorMessage });
        }
    };


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
                <h1 className="font-headline text-3xl font-semibold">
                  {mode === 'edit_final' ? (
                    `Modifier l'Inventaire N°${editingInventoryId}`
                  ) : selectedLieuStockId && lieuStockMap.has(Number(selectedLieuStockId)) ? (
                    <>
                      Nouvel inventaire de <span className="font-bold">{lieuStockMap.get(Number(selectedLieuStockId))?.nom}</span>
                    </>
                  ) : (
                    "Nouvel Inventaire"
                  )}
                </h1>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                            <CardDescription>
                                {isAdmin ? "Sélectionnez un lieu de stock, puis scannez les produits." : "Entrez ou scannez un code-barres pour l'ajouter à l'inventaire."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {isAdmin && (
                                <div className="space-y-2">
                                    <Label htmlFor="lieu-stock">Lieu de Stock</Label>
                                    <Select 
                                        value={selectedLieuStockId} 
                                        onValueChange={setSelectedLieuStockId}
                                        disabled={scannedItems.length > 0}
                                    >
                                        <SelectTrigger id="lieu-stock">
                                            <SelectValue placeholder="Sélectionner un lieu de stock..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lieuxStock.map(lieu => (
                                                <SelectItem key={lieu.id} value={String(lieu.id)}>{lieu.nom}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {scannedItems.length > 0 && <p className="text-xs text-muted-foreground">Videz le panier pour changer de lieu.</p>}
                                </div>
                             )}

                             <div className="space-y-2">
                                <Label htmlFor="barcode">Code-barres</Label>
                                <Input
                                    id="barcode"
                                    placeholder="Entrez un code-barres..."
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                    disabled={isScanning || isSaving || !selectedLieuStockId}
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
                                        disabled={isScanning || isSaving || !selectedLieuStockId}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scanType">Type</Label>
                                    <Select value={scanType} onValueChange={(value: 'UNITE' | 'CARTON') => setScanType(value)} disabled={isScanning || isSaving || !selectedLieuStockId}>
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
                            <Button onClick={handleScan} disabled={!barcode || isScanning || isSaving || quantity < 1 || !selectedLieuStockId} className="w-full">
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter à l\'inventaire'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                     <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="font-headline flex items-center gap-2"><UnitIcon />Produits Scannés</CardTitle>
                                <CardDescription>
                                    {`Liste des produits comptabilisés pour l'inventaire ${selectedLieuStockId ? `à ${lieuStockMap.get(Number(selectedLieuStockId))?.nom}` : ''}.`}
                                </CardDescription>
                            </div>
                             {scannedItems.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="mr-2 h-4 w-4"/> Vider
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action supprimera tous les produits scannés et le brouillon sauvegardé.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearCart}>Confirmer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Lieu</TableHead>
                                      <TableHead className="w-[180px] text-center">Quantité Scannée</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={`${item.produitId}-${item.typeQuantite}`}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell>{item.lieuStockNom}</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                                <Input
                                                  type="number"
                                                  value={item.qteAjoutee}
                                                  onChange={e => handleQuantityChange(item.produitId, item.typeQuantite, parseInt(e.target.value) || 0)}
                                                  className="h-8 w-14 text-center p-0"
                                                  disabled={isSaving}
                                                />
                                                <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                                <div className="flex items-center justify-center gap-2 ml-2">
                                                    {item.typeQuantite === 'CARTON' ? <Box className="h-4 w-4" /> : <UnitIcon className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantite)} disabled={isSaving}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun produit scanné.</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-between items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
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

    