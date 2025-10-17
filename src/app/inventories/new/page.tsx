
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedReapproProduit, Produit, InventairePayload, InventaireLignePayload, Stock } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, ClipboardPaste, Building2, Minus, Plus, RefreshCw, AlertTriangle, ListChecks } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type Draft = {
    timestamp: number;
    scannedItems: ScannedReapproProduit[];
    listItems: Record<string, { cartons: number, unites: number }>;
    selectedLieuStockId: string | undefined;
    source: string;
    isFirstInventory: boolean;
};

type ListItem = {
    produitId: number;
    produitNom: string;
    produitRef: string;
    qteCartons: number;
    qteUnites: number;
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
    const { createInventaire, updateInventaire, currentUser, produits, lieuxStock, hasPermission } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [inventoryMode, setInventoryMode] = useState<'scan' | 'list'>('scan');
    const [pageIsLoading, setPageIsLoading] = useState(true);
    const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);

    // Scan mode state
    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    
    // List mode state
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);

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
    const canSelectLieu = useMemo(() => hasPermission('ALL_STOCK_READ'), [hasPermission]);
    
    const getDraftKey = useCallback(() => {
        if (!currentUser?.id) return null;
        const baseKey = `inventory_draft_${currentUser.id}`;
        if (editingInventoryId) {
            return `${baseKey}_edit_${editingInventoryId}`;
        }
        return `${baseKey}_new_${selectedLieuStockId || 'no_lieu'}`;
    }, [currentUser?.id, editingInventoryId, selectedLieuStockId]);

    const saveDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey) return;
        
        const listItemsRecord: Record<string, { cartons: number, unites: number }> = {};
        listItems.forEach(item => {
            listItemsRecord[item.produitId] = { cartons: item.qteCartons, unites: item.qteUnites };
        });

        const draft: Draft = {
            timestamp: Date.now(),
            scannedItems,
            listItems: listItemsRecord,
            selectedLieuStockId,
            source,
            isFirstInventory,
        };
        
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
            console.warn('Impossible de sauvegarder le brouillon:', error);
        }
    }, [getDraftKey, scannedItems, listItems, selectedLieuStockId, source, isFirstInventory]);

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
                if (now - draft.timestamp < 7 * 24 * 60 * 60 * 1000) return draft;
                localStorage.removeItem(draftKey);
            }
        } catch (error) {
            console.warn('Impossible de charger le brouillon:', error);
        }
        return null;
    }, [getDraftKey]);

    const restoreFromDraft = useCallback(() => {
        if (!draftToRestore) return;
        
        setScannedItems(draftToRestore.scannedItems || []);
        if (draftToRestore.listItems && listItems.length > 0) {
            setListItems(prevList => prevList.map(item => {
                const saved = draftToRestore.listItems[item.produitId];
                return saved ? { ...item, qteCartons: saved.cartons, unites: saved.unites } : item;
            }));
        }
        setSelectedLieuStockId(draftToRestore.selectedLieuStockId);
        setSource(draftToRestore.source || "");
        setIsFirstInventory(draftToRestore.isFirstInventory || false);
        
        toast({
            title: "Travail restauré",
            description: `${(draftToRestore.scannedItems?.length || 0) + Object.keys(draftToRestore.listItems || {}).length} produits récupérés.`
        });
        
        setHasDraftData(false);
        setDraftToRestore(null);
        if (inventoryMode === 'scan') barcodeInputRef.current?.focus();
    }, [draftToRestore, toast, listItems, inventoryMode]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        if (scannedItems.length > 0 || listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0) || source) {
            saveTimeoutRef.current = setTimeout(saveDraft, 1000);
        }
        
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [scannedItems, listItems, source, selectedLieuStockId, isFirstInventory, saveDraft, pageIsLoading, currentUser]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        
        const handleBeforeUnload = () => {
            if (scannedItems.length > 0 || listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0)) {
                saveDraft();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [scannedItems, listItems, saveDraft, pageIsLoading, currentUser]);

    useEffect(() => {
        if (pageIsLoading || !currentUser || editingInventoryId || !selectedLieuStockId) return;
        
        const draft = loadDraft();
        if (draft && (draft.scannedItems?.length > 0 || Object.keys(draft.listItems || {}).length > 0)) {
            setDraftToRestore(draft);
            setHasDraftData(true);
        }
    }, [pageIsLoading, currentUser, editingInventoryId, selectedLieuStockId, loadDraft]);

    useEffect(() => {
        if (selectedLieuStockId && !hasDraftData && !isJsonDialogOpen) {
            if (inventoryMode === 'scan') barcodeInputRef.current?.focus();
        }
    }, [selectedLieuStockId, hasDraftData, isJsonDialogOpen, inventoryMode]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (inventoryMode !== 'scan' || isJsonDialogOpen || document.querySelector('[role="dialog"]')) return;
            
            const activeEl = document.activeElement;
            const isTypingElsewhere = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');
    
            if (isTypingElsewhere) return;
    
            if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); setScanType('CARTON'); return; }
            if (e.key.toLowerCase() === 'u' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); setScanType('UNITE'); return; }
    
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                setQuantity(currentQuantity => {
                    if (!quantityHasBeenManuallySet.current) { quantityHasBeenManuallySet.current = true; return Number(e.key); }
                    const newQuantityString = `${currentQuantity}${e.key}`;
                    return Number(newQuantityString);
                });
            }
            
            if (e.key === 'Backspace' && quantityHasBeenManuallySet.current) {
                e.preventDefault();
                setQuantity(currentQuantity => {
                    const quantityString = String(currentQuantity);
                    if (quantityString.length <= 1) { quantityHasBeenManuallySet.current = false; return 1; }
                    return Number(quantityString.slice(0, -1));
                });
            }
        };
    
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isJsonDialogOpen, inventoryMode]);

    useEffect(() => {
        const lieu = selectedLieuStockId ? lieuStockMap.get(Number(selectedLieuStockId)) : null;
        document.title = lieu ? `Inventaire - ${lieu.nom} - STA` : `Nouvel Inventaire - STA`;
        if (lieu) {
            setInventoryMode(lieu.type?.toUpperCase() === 'MAGASIN' ? 'list' : 'scan');
            if (lieu.type?.toUpperCase() === 'MAGASIN' && editingInventoryId === null) {
                fetchProductsForLieu(lieu.id);
            }
        } else {
            setListItems([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLieuStockId, lieuStockMap]);
    
    useEffect(() => { if (currentUser) setPageIsLoading(false); }, [currentUser]);

    const fetchProductsForLieu = async (lieuId: number) => {
        setIsLoadingList(true);
        try {
            const stockData: Stock[] = await api.getStocksByLieuId(lieuId);
            const items: ListItem[] = stockData.map(stock => ({
                produitId: stock.produitId,
                produitNom: stock.produitNom,
                produitRef: stock.produitRef,
                qteCartons: 0,
                qteUnites: 0,
            })).sort((a,b) => a.produitNom.localeCompare(b.produitNom));
            setListItems(items);
        } catch (error) {
            handleScanError(error);
            setListItems([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        if (pageIsLoading) return;
        
        if (!canSelectLieu && currentUser?.lieuStockId) {
            setSelectedLieuStockId(String(currentUser.lieuStockId));
        }

        const editId = searchParams.get('edit');
        if (editId) {
             toast({ variant: 'destructive', title: 'Non supporté', description: "La modification d'inventaire n'est pas encore implémentée pour ce mode." });
             router.push('/inventories');
        }
    }, [searchParams, currentUser, router, toast, canSelectLieu, pageIsLoading]);
    
    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => setBarcode(e.target.value);

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
                newItems = [{ produitId: product.id, nomProduit: product.nom, ref: product.ref || 'N/A', lieuStockNom: lieuStockNom, qteAjoutee: quantity, barcode: product.codeBarre, typeQuantite: scanType }, ...scannedItems,];
            }
            setScannedItems(newItems);
            toast({ title: "✅ Produit ajouté", description: `${quantity} × ${product.nom} (${scanType})`, duration: 1500 });
        };

        const processScan = (product: Produit) => { addOrUpdateProduct(product); };

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
                toast({ variant: 'destructive',  title: '❌ Produit non trouvé', description: `Code-barres inconnu: ${barcode}` });
            }
        } catch (err) { handleScanError(err); } finally {
            setIsScanning(false);
            setBarcode("");
            setQuantity(1);
            quantityHasBeenManuallySet.current = false;
            setTimeout(() => { barcodeInputRef.current?.focus(); }, 100);
        }
    };
    
    const handleQuantityChange = (produitId: number, type: 'UNITE' | 'CARTON', newQuantity: number) => {
        if (newQuantity <= 0) { handleRemoveItem(produitId, type); return; }
        setScannedItems(currentCart => currentCart.map(item => item.produitId === produitId && item.typeQuantite === type ? { ...item, qteAjoutee: newQuantity } : item));
    };

    const handleListQuantityChange = (produitId: number, type: 'cartons' | 'unites', value: number) => {
        setListItems(prev => prev.map(item => item.produitId === produitId ? { ...item, [type === 'cartons' ? 'qteCartons' : 'qteUnites']: Math.max(0, value) } : item));
    };

    const handleRemoveItem = (produitId: number, type: 'UNITE' | 'CARTON') => setScannedItems(scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type)));
    const handleClearCart = () => { setScannedItems([]); setSource(""); clearDraft(); toast({ title: 'Panier vidé', description: 'Tous les produits scannés ont été retirés.' }); barcodeInputRef.current?.focus(); };
    const handleClearList = () => { setListItems(prev => prev.map(item => ({...item, qteCartons: 0, qteUnites: 0}))); clearDraft(); toast({ title: 'Liste réinitialisée', description: 'Toutes les quantités ont été remises à zéro.' }); };
    const handleScanError = (err: unknown) => toast({ variant: 'destructive', title: 'Erreur', description: err instanceof Error ? err.message : "Une erreur est survenue." });

    const handleCalculateInventory = async () => {
        const hasScanItems = scannedItems.length > 0;
        const hasListItems = listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0);

        if (!hasScanItems && !hasListItems) { toast({ variant: "destructive", title: "Inventaire vide", description: "Veuillez compter au moins un produit." }); return; }
        if (!currentUser?.email) { toast({ variant: "destructive", title: "Utilisateur non identifié" }); return; }
        if (!selectedLieuStockId) { toast({ variant: "destructive", title: "Lieu de stock non sélectionné" }); return; }

        setIsSaving(true);
        const globalLieuStockId = Number(selectedLieuStockId);
        
        let payloadLignes: InventaireLignePayload[] = [];
        
        if (inventoryMode === 'scan') {
            payloadLignes = scannedItems.map(item => ({
                produitId: item.produitId,
                qteScanne: item.qteAjoutee,
                lieuStockId: globalLieuStockId,
                typeQuantiteScanne: item.typeQuantite,
                ref: productMap.get(item.produitId)?.ref || 'N/A',
            }));
        } else { // 'list' mode
            payloadLignes = listItems
                .filter(item => item.qteCartons > 0 || item.qteUnites > 0)
                .flatMap(item => {
                    const lignes: InventaireLignePayload[] = [];
                    const produit = productMap.get(item.produitId);
                    if (item.qteCartons > 0) {
                        lignes.push({ produitId: item.produitId, qteScanne: item.qteCartons, lieuStockId: globalLieuStockId, typeQuantiteScanne: 'CARTON', ref: produit?.ref || 'N/A' });
                    }
                    if (item.qteUnites > 0) {
                        lignes.push({ produitId: item.produitId, qteScanne: item.qteUnites, lieuStockId: globalLieuStockId, typeQuantiteScanne: 'UNITE', ref: produit?.ref || 'N/A' });
                    }
                    return lignes;
                });
        }
        
        if (payloadLignes.length === 0) { toast({ variant: "destructive", title: "Inventaire vide", description: "Veuillez entrer des quantités." }); setIsSaving(false); return; }

        const payload: InventairePayload = { charge: currentUser.email, lieuStockId: globalLieuStockId, produits: payloadLignes };
        
        try {
            const resultInventory = await createInventaire(payload, isFirstInventory);
            if (resultInventory?.id) { clearDraft(); router.push(`/inventories/${resultInventory.id}`); } 
            else { setIsSaving(false); }
        } catch (error) { setIsSaving(false); }
    };
    
    const findProduitsInJson = (data: any): any[] | null => {
        if (Array.isArray(data)) {
            for (const item of data) { const result = findProduitsInJson(item); if (result) return result; }
        } else if (typeof data === 'object' && data !== null && 'produits' in data && Array.isArray(data.produits)) { return data.produits; }
        return null;
    };

    const handleJsonImport = (jsonString: string) => {
        if (!selectedLieuStockId) { toast({ variant: 'destructive', title: 'Action requise', description: "Veuillez d'abord sélectionner un lieu de stock." }); return; }
        const lieuStockSelectionne = lieuStockMap.get(Number(selectedLieuStockId));
        if (!lieuStockSelectionne) { toast({ variant: 'destructive', title: 'Erreur', description: "Le lieu de stock sélectionné est invalide." }); return; }
    
        try {
            const parsedData = JSON.parse(jsonString); const importedProducts = findProduitsInJson(parsedData);
            if (!importedProducts) throw new Error("Le format JSON est invalide ou la clé 'produits' est introuvable.");
    
            const newItems: ScannedReapproProduit[] = []; let skippedCount = 0;
            importedProducts.forEach((ligne: any) => {
                if (typeof ligne.produitId === 'undefined' || typeof ligne.qteScanne === 'undefined') { skippedCount++; return; }
                const productDetails = productMap.get(ligne.produitId);
                newItems.push({ produitId: ligne.produitId, nomProduit: ligne.nomProduit || productDetails?.nom || `Produit ${ligne.produitId}`, ref: ligne.ref || productDetails?.ref || 'N/A', lieuStockNom: lieuStockSelectionne.nom, qteAjoutee: Number(ligne.qteScanne), barcode: ligne.barcode || productDetails?.codeBarre || 'N/A', typeQuantite: ligne.typeQuantiteScanne || 'UNITE' });
            });
            setScannedItems(prevItems => [...newItems, ...prevItems]);
            toast({ title: 'Importation JSON réussie', description: `${newItems.length} produits ajoutés${skippedCount > 0 ? ` (${skippedCount} lignes ignorées)` : ''}.` });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erreur d'analyse du JSON.";
            toast({ variant: 'destructive', title: "Erreur d'importation JSON", description: errorMessage });
        }
    };

    if(pageIsLoading) {
        return <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8"><Skeleton className="h-10 w-64" /><div className="grid gap-8 md:grid-cols-3"><Skeleton className="h-64 md:col-span-1" /><Skeleton className="h-96 md:col-span-2" /></div></div>;
    }

    const renderScanMode = () => (
        <>
            <div className="md:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><ScanLine/> Scanner un produit</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Code-barres</Label>
                            <Input ref={barcodeInputRef} id="barcode" placeholder="Scannez ou entrez un code-barres..." value={barcode} onChange={handleBarcodeChange} onKeyDown={(e) => e.key === 'Enter' && handleScan()} disabled={isScanning || isSaving}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantité</Label>
                                <Input id="quantity" type="number" value={quantity} onChange={(e) => { setQuantity(Number(e.target.value)); quantityHasBeenManuallySet.current = true; }} min="1" disabled={isScanning || isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scanType">Type</Label>
                                <Select value={scanType} onValueChange={(value: 'UNITE' | 'CARTON') => setScanType(value)} disabled={isScanning || isSaving}>
                                    <SelectTrigger id="scanType"><SelectValue placeholder="Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNITE">Unité</SelectItem>
                                        <SelectItem value="CARTON">Carton</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Raccourcis : <kbd className="px-1 py-0.5 bg-muted rounded text-xs">U</kbd>, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd></p>
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
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-2">
                                Produits Scannés
                                {scannedItems.length > 0 && <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full ml-2">auto save</span>}
                            </CardTitle>
                        </div>
                        {scannedItems.length > 0 && 
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Vider</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Vider le panier ?</AlertDialogTitle><AlertDialogDescription>Cette action supprimera tous les produits scannés et le brouillon sauvegardé.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleClearCart}>Confirmer</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        }
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg max-h-[60vh] overflow-y-auto mt-4">
                            <Table>
                                <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[180px] text-center">Quantité</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>{scannedItems.length > 0 ? scannedItems.map(item => <TableRow key={`${item.produitId}-${item.typeQuantite}`}><TableCell className="font-medium">{item.nomProduit}</TableCell><TableCell className="text-center font-semibold"><div className="flex items-center justify-center gap-1"><Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button><Input type="number" value={item.qteAjoutee} onChange={e => handleQuantityChange(item.produitId, item.typeQuantite, parseInt(e.target.value) || 0)} className="h-8 w-14 text-center p-0" disabled={isSaving}/><Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button><span title={item.typeQuantite} className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${item.typeQuantite === 'CARTON' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.typeQuantite === 'CARTON' ? 'C' : 'U'}</span></div></TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantite)} disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="h-24 text-center">Aucun produit scanné.</TableCell></TableRow>}</TableBody>
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
                            <AlertDialogTrigger asChild><Button disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Server className="h-4 w-4 mr-2" />} {isSaving ? "Calcul en cours..." : "Calculer les écarts"}</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Calculer les écarts ?</AlertDialogTitle><AlertDialogDescription>Cette action soumettra la liste pour calculer les écarts. Vous pourrez ensuite confirmer pour appliquer les changements.</AlertDialogDescription></AlertDialogHeader>
                                <div className="flex items-center space-x-2 py-2"><Checkbox id="isFirstInventoryScan" checked={isFirstInventory} onCheckedChange={(checked) => setIsFirstInventory(!!checked)} disabled={editingInventoryId !== null} /><label htmlFor="isFirstInventoryScan" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Ceci est le premier inventaire (réinitialise le stock)</label></div>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleCalculateInventory}>Continuer</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                 </Card>
            </div>
        </>
    );

    const renderListMode = () => (
        <div className="md:col-span-3">
             <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2"><ListChecks/> Saisie de l'Inventaire {listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0) && <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full ml-2">auto save</span>}</CardTitle>
                    </div>
                    {listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0) && 
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Vider</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Réinitialiser les quantités ?</AlertDialogTitle><AlertDialogDescription>Cette action remettra à zéro toutes les quantités saisies.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleClearList}>Confirmer</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    }
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg max-h-[70vh] overflow-y-auto">
                        {isLoadingList ? <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[150px]">Cartons</TableHead><TableHead className="w-[150px]">Unités</TableHead></TableRow></TableHeader>
                            <TableBody>{listItems.map(item => <TableRow key={item.produitId}><TableCell><div className="font-medium">{item.produitNom}</div><div className="text-xs text-muted-foreground">{item.produitRef}</div></TableCell><TableCell><Input type="number" value={item.qteCartons} onChange={e => handleListQuantityChange(item.produitId, 'cartons', parseInt(e.target.value) || 0)} min="0" disabled={isSaving}/></TableCell><TableCell><Input type="number" value={item.qteUnites} onChange={e => handleListQuantityChange(item.produitId, 'unites', parseInt(e.target.value) || 0)} min="0" disabled={isSaving}/></TableCell></TableRow>)}</TableBody>
                        </Table>
                        }
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                   <AlertDialog>
                        <AlertDialogTrigger asChild><Button disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Server className="h-4 w-4 mr-2" />} {isSaving ? "Calcul en cours..." : "Calculer les écarts"}</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Calculer les écarts ?</AlertDialogTitle><AlertDialogDescription>Cette action soumettra la liste pour calculer les écarts. Vous pourrez ensuite confirmer pour appliquer les changements.</AlertDialogDescription></AlertDialogHeader>
                            <div className="flex items-center space-x-2 py-2"><Checkbox id="isFirstInventoryList" checked={isFirstInventory} onCheckedChange={(checked) => setIsFirstInventory(!!checked)} disabled={editingInventoryId !== null} /><label htmlFor="isFirstInventoryList" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Ceci est le premier inventaire (réinitialise le stock)</label></div>
                            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleCalculateInventory}>Continuer</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {hasDraftData && draftToRestore && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3"><RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div><p className="font-medium text-blue-900 dark:text-blue-100">Travail non sauvegardé détecté</p><p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Un inventaire avec des produits a été trouvé.</p><p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Dernière sauvegarde : {new Date(draftToRestore.timestamp).toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-2 shrink-0"><Button variant="outline" size="sm" onClick={() => { setHasDraftData(false); setDraftToRestore(null); barcodeInputRef.current?.focus(); }}>Ignorer</Button><Button size="sm" onClick={restoreFromDraft}><RefreshCw className="h-4 w-4 mr-2" />Restaurer</Button></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center"><h1 className="font-headline text-3xl font-semibold">{lieuStockMap.has(Number(selectedLieuStockId)) ? <>Inventaire de <span className="font-bold">{lieuStockMap.get(Number(selectedLieuStockId))?.nom}</span></> : "Nouvel Inventaire"}</h1></div>
            
            <div className="grid gap-8 md:grid-cols-2">
                {inventoryMode === 'scan' && (
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Building2/>Lieu de Stock</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {canSelectLieu ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="lieu-stock">Sélectionnez le lieu de l'inventaire</Label>
                                        <Select value={selectedLieuStockId} onValueChange={setSelectedLieuStockId} disabled={scannedItems.length > 0 || listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0)}>
                                            <SelectTrigger id="lieu-stock"><SelectValue placeholder="Sélectionner un lieu de stock..." /></SelectTrigger>
                                            <SelectContent>{lieuxStock.map(lieu => <SelectItem key={lieu.id} value={String(lieu.id)}>{lieu.nom} ({lieu.type})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-2"><Label>Lieu de Stock assigné</Label><Input value={`${currentUser?.lieuNom} (${lieuStockMap.get(Number(selectedLieuStockId))?.type})` || "Aucun lieu assigné"} disabled /></div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!selectedLieuStockId ? (
                    <div className="md:col-span-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    Veuillez sélectionner un lieu pour commencer l'inventaire.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : inventoryMode === 'scan' ? renderScanMode() : renderListMode()}
            </div>
        </div>
    );
}
