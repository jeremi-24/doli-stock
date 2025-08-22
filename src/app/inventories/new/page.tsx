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
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, ClipboardPaste, Building2, Minus, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
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
    isFirstInventory: boolean;
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
    const { createInventaire, updateInventaire, currentUser, produits, lieuxStock } = useApp();
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
    const [source, setSource] = useState("");
    const [hasDraftData, setHasDraftData] = useState(false);
    const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);
    
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const quantityHasBeenManuallySet = useRef(false);

    const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);
    const lieuStockMap = useMemo(() => new Map(lieuxStock.map(l => [l.id, l])), [lieuxStock]);
    const isAdmin = useMemo(() => pageIsLoading ? false : currentUser?.roleNom === 'ADMIN', [currentUser, pageIsLoading]);
    
    // ... (la logique de brouillon reste identique)
    const getDraftKey = useCallback(() => {
        if (!currentUser?.id) return null;
        const baseKey = `inventory_draft_${currentUser.id}`;
        if (mode === 'edit_final' && editingInventoryId) {
            return `${baseKey}_edit_${editingInventoryId}`;
        }
        return `${baseKey}_new_${selectedLieuStockId || 'no_lieu'}`;
    }, [currentUser?.id, mode, editingInventoryId, selectedLieuStockId]);

    const saveDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey || (!scannedItems.length && !source)) return;
        
        const draft: Draft = {
            timestamp: Date.now(),
            scannedItems,
            selectedLieuStockId,
            source,
            isFirstInventory,
        };
        
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
            console.warn('Impossible de sauvegarder le brouillon:', error);
        }
    }, [getDraftKey, scannedItems, selectedLieuStockId, source, isFirstInventory]);

    const clearDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey) return;
        
        try {
            localStorage.removeItem(draftKey);
            setHasDraftData(false);
            setDraftToRestore(null);
        } catch (error) {
            console.warn('Impossible de supprimer le brouillon:', error);
        }
    }, [getDraftKey]);

    const loadDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey) return null;
        
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const draft: Draft = JSON.parse(savedDraft);
                const now = Date.now();
                if (now - draft.timestamp < 24 * 60 * 60 * 1000) {
                    return draft;
                } else {
                    localStorage.removeItem(draftKey);
                }
            }
        } catch (error) {
            console.warn('Impossible de charger le brouillon:', error);
        }
        return null;
    }, [getDraftKey]);

    const restoreFromDraft = useCallback(() => {
        if (!draftToRestore) return;
        
        setScannedItems(draftToRestore.scannedItems || []);
        setSelectedLieuStockId(draftToRestore.selectedLieuStockId);
        setSource(draftToRestore.source || "");
        setIsFirstInventory(draftToRestore.isFirstInventory || false);
        
        toast({
            title: "Travail restauré",
            description: `${draftToRestore.scannedItems?.length || 0} produits récupérés depuis la dernière session.`
        });
        
        setHasDraftData(false);
        setDraftToRestore(null);
        barcodeInputRef.current?.focus();
    }, [draftToRestore, toast]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        if (scannedItems.length > 0 || source) {
            saveTimeoutRef.current = setTimeout(() => {
                saveDraft();
            }, 1000);
        }
        
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [scannedItems, source, selectedLieuStockId, isFirstInventory, saveDraft, pageIsLoading, currentUser]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        
        const handleBeforeUnload = () => {
            if (scannedItems.length > 0) {
                saveDraft();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [scannedItems, saveDraft, pageIsLoading, currentUser]);

    useEffect(() => {
        if (pageIsLoading || !currentUser || mode === 'edit_final' || !selectedLieuStockId) {
            return;
        }
        
        const draft = loadDraft();
        if (draft && draft.scannedItems && draft.scannedItems.length > 0) {
            setDraftToRestore(draft);
            setHasDraftData(true);
        }
    }, [pageIsLoading, currentUser, mode, selectedLieuStockId, loadDraft]);

    useEffect(() => {
        if (selectedLieuStockId && !hasDraftData && !isJsonDialogOpen) {
            barcodeInputRef.current?.focus();
        }
    }, [selectedLieuStockId, hasDraftData, isJsonDialogOpen]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isJsonDialogOpen || document.querySelector('[role="dialog"]')) return;
            
            const activeEl = document.activeElement;
            const isTypingElsewhere = activeEl && (
                activeEl.tagName === 'TEXTAREA' || 
                (activeEl.tagName === 'INPUT' && activeEl.id !== 'barcode')
            );
    
            if (isTypingElsewhere) return;
    
            // Gestion des touches C et U pour changer le type
            if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                setScanType('CARTON');
                return;
            }
            
            if (e.key.toLowerCase() === 'u' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                setScanType('UNITE');
                return;
            }
    
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                setQuantity(currentQuantity => {
                    if (!quantityHasBeenManuallySet.current) {
                        quantityHasBeenManuallySet.current = true;
                        return Number(e.key);
                    }
                    const newQuantityString = `${currentQuantity}${e.key}`;
                    return Number(newQuantityString);
                });
            }
            
            if (e.key === 'Backspace' && quantityHasBeenManuallySet.current) {
                e.preventDefault();
                setQuantity(currentQuantity => {
                    const quantityString = String(currentQuantity);
                    if (quantityString.length <= 1) {
                        quantityHasBeenManuallySet.current = false;
                        return 1;
                    }
                    return Number(quantityString.slice(0, -1));
                });
            }
        };
    
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isJsonDialogOpen]);

    useEffect(() => {
        const lieu = selectedLieuStockId ? lieuStockMap.get(Number(selectedLieuStockId)) : null;
        document.title = lieu ? `Inventaire - ${lieu.nom} - STA` : `Nouvel Inventaire - STA`;
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
            if (!editId) {
                setMode('new');
                return;
            }
            try {
                setMode('edit_final');
                const id = Number(editId);
                setEditingInventoryId(id);
                const inventoryData = await api.getInventaire(id);
                if (!inventoryData) throw new Error("Inventaire non trouvé.");
                if(inventoryData.lignes) {
                    const items: ScannedReapproProduit[] = inventoryData.lignes.map((ligne: any) => ({
                        produitId: ligne.produitId,
                        nomProduit: ligne.nomProduit,
                        ref: ligne.ref,
                        lieuStockNom: ligne.lieuStockNom,
                        qteAjoutee: ligne.qteScanneTotaleUnites,
                        barcode: 'N/A',
                        typeQuantite: 'UNITE',
                    }));
                    setScannedItems(items.reverse());
                }
                if(inventoryData.lieuStockId) setSelectedLieuStockId(String(inventoryData.lieuStockId));
                toast({ title: `Modification de l'inventaire N°${editId}` });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données pour modification.' });
                router.push('/inventories');
            }
        };

        loadData();
    }, [searchParams, currentUser, router, toast, isAdmin, pageIsLoading]);
    
    // MODIFICATION SIMPLIFIÉE : Cette fonction ne fait plus que mettre à jour l'état du code-barres.
    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBarcode(e.target.value);
    };

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
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        ref: product.ref || 'N/A',
                        lieuStockNom: lieuStockNom, 
                        qteAjoutee: quantity,
                        barcode: product.codeBarre,
                        typeQuantite: scanType,
                    },
                    ...scannedItems,
                ];
            }
            setScannedItems(newItems);
            
            toast({ 
                title: "✅ Produit ajouté", 
                description: `${quantity} × ${product.nom} (${scanType})`,
                duration: 1500
            });
        };

        const processScan = (product: Produit) => {
            addOrUpdateProduct(product);
        };

        if (productCache.has(barcode)) {
            processScan(productCache.get(barcode)!);
            setBarcode("");
    setQuantity(1);
    quantityHasBeenManuallySet.current = false;
    barcodeInputRef.current?.focus();
    return;
        }

        setIsScanning(true);
        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
                setProductCache(prevCache => new Map(prevCache).set(barcode, product));
                processScan(product);
            } else {
                toast({ variant: 'destructive',  title: '❌ Produit non trouvé',
                    description: `Code-barres inconnu: ${barcode}` });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
            toast({ variant: 'destructive', title: 'Erreur de scan', description: errorMessage });
        } finally {
            setIsScanning(false);
            // MODIFICATION CORRIGÉE : La réinitialisation a lieu ici, APRES le scan.
            setBarcode("");
            setQuantity(1);
            quantityHasBeenManuallySet.current = false;
            setTimeout(() => {
                barcodeInputRef.current?.focus();
            }, 100)
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
        setScannedItems(scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type)));
    };

    const handleClearCart = () => {
        setScannedItems([]);
        setSource("");
        clearDraft();
        toast({ title: 'Panier vidé', description: 'Tous les produits scannés ont été retirés.' });
        barcodeInputRef.current?.focus();
    };
    
    // ... (le reste du code est inchangé)
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
                ref: product?.ref || 'N/A',
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
                    ref: ligne.ref || productDetails?.ref || 'N/A',
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
            {hasDraftData && draftToRestore && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100">Travail non sauvegardé détecté</p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Un inventaire avec {draftToRestore.scannedItems?.length || 0} produits a été trouvé 
                                        {draftToRestore.selectedLieuStockId && ` pour ${lieuStockMap.get(Number(draftToRestore.selectedLieuStockId))?.nom}`}.
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Dernière sauvegarde : {new Date(draftToRestore.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        setHasDraftData(false);
                                        setDraftToRestore(null);
                                        barcodeInputRef.current?.focus();
                                    }}
                                >
                                    Ignorer
                                </Button>
                                <Button size="sm" onClick={restoreFromDraft}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Restaurer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">
                  {mode === 'edit_final' ? `Modifier l'Inventaire N°${editingInventoryId}`
                  : selectedLieuStockId && lieuStockMap.has(Number(selectedLieuStockId)) ? (
                    <>Nouvel inventaire de <span className="font-bold">{lieuStockMap.get(Number(selectedLieuStockId))?.nom}</span></>
                  ) : "Nouvel Inventaire"}
                </h1>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                            <CardDescription>
                                {isAdmin ? "Sélectionnez un lieu de stock, puis scannez." : "Scannez un code-barres pour l'ajouter."}
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
                                    ref={barcodeInputRef}
                                    id="barcode"
                                    placeholder="Scannez ou entrez un code-barres..."
                                    value={barcode}
                                    onChange={handleBarcodeChange}
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
                                        onChange={(e) => {
                                            setQuantity(Number(e.target.value));
                                            quantityHasBeenManuallySet.current = true;
                                        }}
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
    <p className="text-xs text-muted-foreground">
        Raccourcis : <kbd className="px-1 py-0.5 bg-muted rounded text-xs">U</kbd> pour Unité, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd> pour Carton
    </p>
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
                                <CardTitle className="font-headline flex items-center gap-2">
                                    <UnitIcon />
                                    Produits Scannés
                                    {scannedItems.length > 0 && (
                                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full ml-2">
                                             auto save
                                        </span>
                                    )}
                                </CardTitle>
                            </div>
                             {scannedItems.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Vider</Button>
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
                             <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Réf.</TableHead>
                                      <TableHead>Lieu</TableHead>
                                      <TableHead className="w-[180px] text-center">Quantité</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scannedItems.length > 0 ? scannedItems.map(item => (
                                      <TableRow key={`${item.produitId}-${item.typeQuantite}`}>
                                        <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{item.ref}</TableCell>
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
                                                <span title={item.typeQuantite === 'CARTON' ? 'Carton' : 'Unité'} className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${item.typeQuantite === 'CARTON' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.typeQuantite === 'CARTON' ? 'C' : 'U'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantite)} disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                                <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
                                    <DialogTrigger asChild><Button variant="outline" disabled={isSaving}><ClipboardPaste className="h-4 w-4 mr-2" />Coller JSON</Button></DialogTrigger>
                                    <JSONImportDialog onImport={handleJsonImport} onOpenChange={setIsJsonDialogOpen} />
                                </Dialog>
                            </div>
                           <AlertDialog>
                            <AlertDialogTrigger asChild><Button disabled={scannedItems.length === 0 || isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Server className="h-4 w-4 mr-2" />} {isSaving ? "Calcul en cours..." : "Calculer les écarts"}</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Calculer les écarts ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action soumettra la liste pour calculer les écarts. Vous pourrez ensuite confirmer pour appliquer les changements.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex items-center space-x-2 py-2">
                                    <Checkbox id="isFirstInventory" checked={isFirstInventory} onCheckedChange={(checked) => setIsFirstInventory(!!checked)} disabled={mode === 'edit_final'} />
                                    <label htmlFor="isFirstInventory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Ceci est le premier inventaire (réinitialise le stock)</label>
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