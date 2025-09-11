
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedReapproProduit, Produit, ReapproPayload, ReapproPayloadLigne } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, Building2, Minus, Plus, RefreshCw, Truck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type Draft = {
    timestamp: number;
    scannedItems: ScannedReapproProduit[];
    selectedLieuStockId: string | undefined;
};

export default function NewReapproPage() {
    const { addReapprovisionnement, currentUser, produits, lieuxStock, isMounted } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [pageIsLoading, setPageIsLoading] = useState(true);
    const [scannedItems, setScannedItems] = useState<ScannedReapproProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());
    const [selectedLieuStockId, setSelectedLieuStockId] = useState<string | undefined>(undefined);
    const [hasDraftData, setHasDraftData] = useState(false);
    const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);
    
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const lieuStockMap = useMemo(() => new Map(lieuxStock.map(l => [l.id, l])), [lieuxStock]);
    const isAdmin = useMemo(() => currentUser?.roleNom === 'ADMIN', [currentUser]);

    const getDraftKey = useCallback(() => {
        if (!currentUser?.id || !selectedLieuStockId) return null;
        return `reappro_draft_${currentUser.id}_lieu_${selectedLieuStockId}`;
    }, [currentUser?.id, selectedLieuStockId]);

    const saveDraft = useCallback(() => {
        const draftKey = getDraftKey();
        if (!draftKey || !scannedItems.length) return;
        const draft: Draft = { timestamp: Date.now(), scannedItems, selectedLieuStockId };
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
            console.warn('Impossible de sauvegarder le brouillon:', error);
        }
    }, [getDraftKey, scannedItems, selectedLieuStockId]);

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
        toast({ title: "Brouillon restauré", description: `${draftToRestore.scannedItems?.length || 0} produits récupérés.` });
        setHasDraftData(false);
        setDraftToRestore(null);
        barcodeInputRef.current?.focus();
    }, [draftToRestore, toast]);

    useEffect(() => {
        if (pageIsLoading || !currentUser) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (scannedItems.length > 0) {
            saveTimeoutRef.current = setTimeout(saveDraft, 1000);
        }
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [scannedItems, saveDraft, pageIsLoading, currentUser]);
    
    useEffect(() => {
        if (pageIsLoading || !currentUser || !selectedLieuStockId) return;
        const draft = loadDraft();
        if (draft && draft.scannedItems && draft.scannedItems.length > 0) {
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
            barcodeInputRef.current?.focus();
        }
    }, [selectedLieuStockId, hasDraftData]);

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
        if (newQuantity <= 0) return handleRemoveItem(produitId, type);
        setScannedItems(currentCart =>
            currentCart.map(item =>
                item.produitId === produitId && item.typeQuantite === type
                    ? { ...item, qteAjoutee: newQuantity } : item));
    };

    const handleRemoveItem = (produitId: number, type: 'UNITE' | 'CARTON') => {
        setScannedItems(scannedItems.filter(item => !(item.produitId === produitId && item.typeQuantite === type)));
    };

    const handleClearCart = () => {
        setScannedItems([]);
        clearDraft();
        toast({ title: 'Panier vidé', description: 'Tous les produits scannés ont été retirés.' });
        barcodeInputRef.current?.focus();
    };

    const handleSave = async () => {
        if (!selectedLieuStockId) { toast({ variant: "destructive", title: "Veuillez sélectionner un lieu de stock" }); return; }
        if (scannedItems.length === 0) { toast({ variant: "destructive", title: "Liste vide", description: "Veuillez scanner au moins un produit." }); return; }
        if (!currentUser?.email) { toast({ variant: "destructive", title: "Utilisateur inconnu" }); return; }
        
        setIsSaving(true);
        
        const payload: ReapproPayload = {
            agent: currentUser.email,
            lieuStockId: Number(selectedLieuStockId),
            lignes: scannedItems.map(item => ({
                produitId: item.produitId,
                qteAjoutee: item.qteAjoutee,
                typeQuantite: item.typeQuantite,
            }))
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
                                        Un brouillon avec {draftToRestore.scannedItems?.length || 0} produits a été trouvé.
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
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><ScanLine />Scanner un produit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {isAdmin ? (
                                <div className="space-y-2">
                                    <Label htmlFor="lieu-stock">Lieu de Stock</Label>
                                    <Select value={selectedLieuStockId} onValueChange={setSelectedLieuStockId} disabled={scannedItems.length > 0}>
                                        <SelectTrigger id="lieu-stock"><SelectValue placeholder="Sélectionner un lieu..." /></SelectTrigger>
                                        <SelectContent>
                                            {lieuxStock.map(lieu => (<SelectItem key={lieu.id} value={String(lieu.id)}>{lieu.nom}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    {scannedItems.length > 0 && <p className="text-xs text-muted-foreground">Videz le panier pour changer de lieu.</p>}
                                </div>
                             ) : (
                                <div className="space-y-2">
                                  <Label>Lieu de Stock</Label>
                                  <Input value={currentUser?.lieuNom || "Aucun lieu assigné"} disabled />
                                </div>
                             )}

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
                                            <AlertDialogAction onClick={handleClearCart}>Confirmer</AlertDialogAction>
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
            </div>
        </div>
    );
}

    