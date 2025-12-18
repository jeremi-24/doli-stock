
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedReapproProduit, Produit, ReapproPayload, Stock } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, Building2, Minus, Plus, RefreshCw, Truck, ListChecks } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type Draft = {
    timestamp: number;
    scannedItems: ScannedReapproProduit[];
    listItems: Record<string, { cartons: number, unites: number }>;
    selectedLieuStockId: string | undefined;
};

type ListItem = {
    produitId: number;
    produitNom: string;
    produitRef: string;
    qteCartons: number;
    qteUnites: number;
};

export default function NewReapproPage() {
    const { addReapprovisionnement, currentUser, produits, lieuxStock, byScan } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [mode, setMode] = useState<'scan' | 'list'>(byScan ? 'scan' : 'list');
    const [pageIsLoading, setPageIsLoading] = useState(true);

    // Common state
    const [selectedLieuStockId, setSelectedLieuStockId] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    
    // Scan mode state
    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());

    // List mode state
    const [listItems, setListItems] = useState<ListItem[]>([]);
    
    // Drafts
    const [hasDraftData, setHasDraftData] = useState(false);
    const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const lieuStockMap = useMemo(() => new Map(lieuxStock.map(l => [l.id, l])), [lieuxStock]);
    const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);
    const isAdmin = useMemo(() => currentUser?.roleNom === 'ADMIN', [currentUser]);

    useEffect(() => {
        setMode(byScan ? 'scan' : 'list');
    }, [byScan]);

    const getDraftKey = useCallback(() => {
        if (!currentUser?.id || !selectedLieuStockId) return null;
        return `reappro_draft_${currentUser.id}_lieu_${selectedLieuStockId}`;
    }, [currentUser?.id, selectedLieuStockId]);

    const saveDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey) return;
        
        const listItemsRecord: Record<string, { cartons: number; unites: number }> = {};
        listItems.forEach(item => {
            listItemsRecord[item.produitId] = { cartons: item.qteCartons, unites: item.qteUnites };
        });

        const draft: Draft = { 
            timestamp: Date.now(), 
            scannedItems, 
            listItems: listItemsRecord,
            selectedLieuStockId 
        };
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
            console.warn('Impossible de sauvegarder le brouillon:', error);
        }
    }, [getDraftKey, scannedItems, listItems, selectedLieuStockId]);

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
                if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) return draft;
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
        
        if (draftToRestore.listItems) {
             setListItems(prevList => {
                const draftListItems = draftToRestore.listItems || {};
                return prevList.map(item => {
                    const saved = draftListItems[item.produitId];
                    return saved ? { ...item, qteCartons: saved.cartons, qteUnites: saved.unites } : item;
                });
            });
        }
        
        toast({ title: "Brouillon restauré", description: `Données récupérées.` });
        setHasDraftData(false);
        setDraftToRestore(null);
        if (mode === 'scan') barcodeInputRef.current?.focus();
    }, [draftToRestore, toast, mode]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (scannedItems.length > 0 || listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0)) {
            saveTimeoutRef.current = setTimeout(saveDraft, 1000);
        }
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [scannedItems, listItems, saveDraft, pageIsLoading, currentUser]);
    
    useEffect(() => {
        if (pageIsLoading || !currentUser || !selectedLieuStockId) return;
        const draft = loadDraft();
        if (draft && ((draft.scannedItems && draft.scannedItems.length > 0) || (draft.listItems && Object.keys(draft.listItems).length > 0))) {
            setDraftToRestore(draft);
            setHasDraftData(true);
        }
    }, [pageIsLoading, currentUser, selectedLieuStockId, loadDraft]);

    useEffect(() => {
        if (currentUser) {
            if (currentUser.roleNom !== 'ADMIN' && currentUser.lieuStockId) {
                setSelectedLieuStockId(String(currentUser.lieuStockId));
            }
            setPageIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (selectedLieuStockId && !hasDraftData) {
            if (mode === 'scan') barcodeInputRef.current?.focus();
        }
    }, [selectedLieuStockId, hasDraftData, mode]);

    useEffect(() => {
        document.title = selectedLieuStockId ? `Réappro - ${lieuStockMap.get(Number(selectedLieuStockId))?.nom}` : 'Nouveau Réapprovisionnement';
        if (selectedLieuStockId && mode === 'list') {
            const allProductsItems = produits.map(p => ({
                produitId: p.id,
                produitNom: p.nom,
                produitRef: p.ref,
                qteCartons: 0,
                qteUnites: 0
            })).sort((a,b) => a.produitNom.localeCompare(b.produitNom));
            setListItems(allProductsItems);
        } else {
            setListItems([]);
        }
    }, [selectedLieuStockId, mode, produits, lieuStockMap]);

    const handleScan = async () => {
        if (!barcode.trim() || !currentUser || !selectedLieuStockId) return;

        const lieuStock = lieuStockMap.get(Number(selectedLieuStockId));
        if (!lieuStock) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Le lieu de stock sélectionné est invalide." });
            return;
        }
        
        const processProduct = (product: Produit) => {
            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id && item.typeQuantite === scanType);
            if (existingItemIndex > -1) {
                const newItems = [...scannedItems];
                newItems[existingItemIndex].qteAjoutee += quantity;
                setScannedItems(newItems);
            } else {
                const newItem: ScannedReapproProduit = {
                    produitId: product.id,
                    nomProduit: product.nom,
                    ref: product.ref || 'N/A',
                    lieuStockNom: lieuStock.nom,
                    qteAjoutee: quantity,
                    barcode: product.codeBarre,
                    typeQuantite: scanType,
                };
                setScannedItems(prevItems => [newItem, ...prevItems]);
            }
            toast({ title: "✅ Produit ajouté", description: `${quantity} × ${product.nom} (${scanType})`, duration: 1500 });
            setBarcode("");
            setQuantity(1);
            barcodeInputRef.current?.focus();
        };

        if (productCache.has(barcode)) {
            return processProduct(productCache.get(barcode)!);
        }
        
        setIsScanning(true);
        try {
            const product = await api.getProductByBarcode(barcode);
            if (product && product.id) {
                setProductCache(prevCache => new Map(prevCache).set(barcode, product));
                processProduct(product);
            } else {
                toast({ variant: 'destructive', title: '❌ Produit non trouvé', description: `Code-barres inconnu: ${barcode}` });
            }
        } catch (err) {
            handleScanError(err);
        } finally {
            setIsScanning(false);
            setBarcode("");
            setQuantity(1);
            barcodeInputRef.current?.focus();
        }
    };
    
    const handleScanError = (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de scan', description: errorMessage });
    }
    
    const handleQuantityChange = (produitId: number, type: 'UNITE' | 'CARTON', newQuantity: number) => {
        if (newQuantity < 0) return;
        if (newQuantity === 0) return handleRemoveItem(produitId, type);
        setScannedItems(currentCart =>
            currentCart.map(item =>
                item.produitId === produitId && item.typeQuantite === type
                    ? { ...item, qteAjoutee: newQuantity } : item));
    };

    const handleListQuantityChange = (produitId: number, type: 'cartons' | 'unites', value: number) => {
        const newValue = Math.max(0, value);
        setListItems(prev => {
          return prev.map(item =>
            item.produitId === produitId
              ? { ...item, [type]: newValue }
              : item
          );
        });
      };

    const handleRemoveItem = (produitId: number, type: 'UNITE' | 'CARTON') => {
        setScannedItems(scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type)));
    };

    const handleClear = () => {
        setScannedItems([]);
        setListItems(prev => prev.map(i => ({...i, qteCartons: 0, qteUnites: 0})));
        clearDraft();
        toast({ title: 'Liste vidée' });
        if(mode === 'scan') barcodeInputRef.current?.focus();
    };

    const handleSave = async () => {
        if (!selectedLieuStockId) { toast({ variant: "destructive", title: "Veuillez sélectionner un lieu de stock" }); return; }
        if (mode === 'scan' && scannedItems.length === 0) { toast({ variant: "destructive", title: "Liste vide", description: "Veuillez scanner au moins un produit." }); return; }
        if (mode === 'list' && !listItems.some(i => i.qteCartons > 0 || i.qteUnites > 0)) { toast({ variant: "destructive", title: "Liste vide", description: "Veuillez saisir au moins une quantité." }); return; }
        if (!currentUser?.email) { toast({ variant: "destructive", title: "Utilisateur inconnu" }); return; }
        
        setIsSaving(true);

        const lignes = mode === 'scan'
            ? scannedItems.map(item => ({
                produitId: item.produitId,
                qteAjoutee: item.qteAjoutee,
                typeQuantite: item.typeQuantite,
            }))
            : listItems
                .filter(item => item.qteCartons > 0 || item.qteUnites > 0)
                .flatMap(item => {
                    const res = [];
                    if (item.qteCartons > 0) res.push({ produitId: item.produitId, qteAjoutee: item.qteCartons, typeQuantite: 'CARTON' as const });
                    if (item.qteUnites > 0) res.push({ produitId: item.produitId, qteAjoutee: item.qteUnites, typeQuantite: 'UNITE' as const });
                    return res;
                });
        
        const payload: ReapproPayload = {
            agent: currentUser.email,
            lieuStockId: Number(selectedLieuStockId),
            lignes: lignes
        };
        
        const newReappro = await addReapprovisionnement(payload);
        
        if (newReappro && newReappro.id != null) {
            clearDraft();
            router.push(`/reapprovisionnements/${newReappro.id}`);
        } else {
            setIsSaving(false);
        }
    };
    
    if (pageIsLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-8 md:grid-cols-3">
                    <Skeleton className="h-64 md:col-span-1" />
                    <Skeleton className="h-96 md:col-span-2" />
                </div>
            </div>
        );
    }

    const renderScanMode = () => (
        <>
        <div className="md:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="barcode">Code-barres</Label>
                        <Input ref={barcodeInputRef} id="barcode" placeholder="Scannez ou entrez un code..." value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScan()} disabled={isScanning || isSaving || !selectedLieuStockId}/>
                    </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantité</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" disabled={isScanning || isSaving || !selectedLieuStockId}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scanType">Type</Label>
                            <Select value={scanType} onValueChange={(value: 'UNITE' | 'CARTON') => setScanType(value)} disabled={isScanning || isSaving || !selectedLieuStockId}>
                                <SelectTrigger id="scanType"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNITE">Unité</SelectItem>
                                    <SelectItem value="CARTON">Carton</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleScan} disabled={!barcode || isScanning || isSaving || quantity < 1 || !selectedLieuStockId} className="w-full">
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2"><Truck />Produits de l'arrivage</CardTitle>
                        {scannedItems.length > 0 && <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full ml-2">Sauvegarde auto</span>}
                    </div>
                        {scannedItems.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Vider</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Vider l'arrivage ?</AlertDialogTitle><AlertDialogDescription>Cette action supprimera tous les produits scannés et le brouillon.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClear}>Confirmer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardHeader>
                <CardContent>
                        <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Réf.</TableHead><TableHead>Lieu</TableHead><TableHead className="w-[180px] text-center">Quantité</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                            <TableBody>
                            {scannedItems.length > 0 ? scannedItems.map(item => (
                                <TableRow key={`${item.produitId}-${item.typeQuantite}`}>
                                <TableCell className="font-medium">{item.nomProduit}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.ref}</TableCell>
                                <TableCell>{item.lieuStockNom}</TableCell>
                                <TableCell className="text-center font-semibold">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                        <Input type="number" value={item.qteAjoutee} onChange={e => handleQuantityChange(item.produitId, item.typeQuantite, parseInt(e.target.value) || 0)} className="h-8 w-14 text-center p-0" disabled={isSaving}/>
                                        <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.typeQuantite, item.qteAjoutee + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                        <span title={item.typeQuantite} className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${item.typeQuantite === 'CARTON' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.typeQuantite === 'CARTON' ? 'C' : 'U'}</span>
                                    </div>
                                </TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.produitId, item.typeQuantite)} disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                </TableRow>
                            )) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <AlertDialog>
                    <AlertDialogTrigger asChild><Button disabled={scannedItems.length === 0 || isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2" />} {isSaving ? "Enregistrement..." : "Enregistrer l'arrivage"}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmer l'arrivage ?</AlertDialogTitle><AlertDialogDescription>Cette action mettra à jour le stock pour {scannedItems.length} produit(s) dans le lieu sélectionné.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSave}>Confirmer et Enregistrer</AlertDialogAction>
                        </AlertDialogFooter>
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
                        <CardTitle className="font-headline flex items-center gap-2"><ListChecks/> Saisie du Réapprovisionnement</CardTitle>
                        {listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0) && <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full ml-2">auto save</span>}
                    </div>
                    {listItems.some(item => item.qteCartons > 0 || item.qteUnites > 0) && 
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Vider</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Réinitialiser les quantités ?</AlertDialogTitle><AlertDialogDescription>Cette action remettra à zéro toutes les quantités saisies.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleClear}>Confirmer</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    }
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg max-h-[70vh] overflow-y-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[150px]">Cartons</TableHead><TableHead className="w-[150px]">Unités</TableHead></TableRow></TableHeader>
                            <TableBody>{listItems.map(item => <TableRow key={item.produitId}><TableCell><div className="font-medium">{item.produitNom}</div><div className="text-xs text-muted-foreground">{item.produitRef}</div></TableCell><TableCell><Input type="number" value={item.qteCartons} onChange={e => handleListQuantityChange(item.produitId, 'cartons', parseInt(e.target.value) || 0)} min="0" disabled={isSaving}/></TableCell><TableCell><Input type="number" value={item.qteUnites} onChange={e => handleListQuantityChange(item.produitId, 'unites', parseInt(e.target.value) || 0)} min="0" disabled={isSaving}/></TableCell></TableRow>)}</TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                   <AlertDialog>
                        <AlertDialogTrigger asChild><Button disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2" />} {isSaving ? "Enregistrement..." : "Enregistrer l'arrivage"}</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirmer l'arrivage ?</AlertDialogTitle><AlertDialogDescription>Cette action mettra à jour le stock.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleSave}>Confirmer et Enregistrer</AlertDialogAction></AlertDialogFooter>
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
                            <div className="flex items-start gap-3">
                                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100">Brouillon de réapprovisionnement détecté</p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Un brouillon a été trouvé.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => { setHasDraftData(false); setDraftToRestore(null); }}>Ignorer</Button>
                                <Button size="sm" onClick={restoreFromDraft}><RefreshCw className="h-4 w-4 mr-2" />Restaurer</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Nouveau Réapprovisionnement</h1>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Building2/>Lieu de Destination</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isAdmin ? (
                                <div className="space-y-2">
                                    <Label htmlFor="lieu-stock">Lieu de Stock</Label>
                                    <Select value={selectedLieuStockId} onValueChange={setSelectedLieuStockId} disabled={scannedItems.length > 0 || listItems.some(i => i.qteCartons > 0 || i.qteUnites > 0)}>
                                        <SelectTrigger id="lieu-stock"><SelectValue placeholder="Sélectionner un lieu..." /></SelectTrigger>
                                        <SelectContent>
                                            {lieuxStock.map(lieu => (<SelectItem key={lieu.id} value={String(lieu.id)}>{lieu.nom}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    {(scannedItems.length > 0 || listItems.some(i => i.qteCartons > 0 || i.qteUnites > 0)) && <p className="text-xs text-muted-foreground">Videz la liste pour changer de lieu.</p>}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Lieu de Stock</Label>
                                    <Input value={currentUser?.lieuNom || "Aucun lieu assigné"} disabled />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {!selectedLieuStockId ? (
                    <div className="md:col-span-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    Veuillez sélectionner un lieu pour commencer.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : mode === 'scan' ? renderScanMode() : renderListMode()}

            </div>
        </div>
    );
}

    