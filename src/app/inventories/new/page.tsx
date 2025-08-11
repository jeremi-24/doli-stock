
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-provider';
import type { ScannedProduit, Produit } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Save, Loader2, Trash2, Box, Package as UnitIcon, Server, FileDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function SaveDraftDialog({ onSave, onOpenChange, initialName }: { onSave: (name: string) => void, onOpenChange: (open: boolean) => void, initialName?: string }) {
    const [name, setName] = useState(initialName || `Brouillon ${new Date().toLocaleDateString('fr-FR')}`);
    
    useEffect(() => {
      if(initialName) {
        setName(initialName);
      }
    }, [initialName])

    const handleSave = () => {
        onSave(name);
        onOpenChange(false);
    }
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Sauvegarder le brouillon</DialogTitle>
                <DialogDescription>Donnez un nom à ce brouillon d'inventaire pour le retrouver plus tard.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="draft-name">Nom du brouillon</Label>
                <Input id="draft-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                <Button onClick={handleSave} disabled={!name}>Sauvegarder</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function NewInventoryPage() {
    const { createInventaire, currentUser } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [drafts, setDrafts] = useLocalStorage<any[]>('inventory_drafts', []);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

    const [scannedItems, setScannedItems] = useState<ScannedProduit[]>([]);
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [scanType, setScanType] = useState<'UNITE' | 'CARTON'>('UNITE');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [productCache, setProductCache] = useState<Map<string, Produit>>(new Map());
    const [isFirstInventory, setIsFirstInventory] = useState(false);
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);

    useEffect(() => {
        const draftId = searchParams.get('draft');
        if (draftId) {
            const draft = drafts.find(d => d.id === draftId);
            if (draft) {
                setScannedItems(draft.items);
                setActiveDraftId(draft.id);
                if(searchParams.get('loaded') !== 'true') {
                    toast({ title: `Brouillon "${draft.name}" chargé.` });
                    router.replace(`/inventories/new?draft=${draftId}&loaded=true`, { scroll: false });
                }
            }
        }
    }, [searchParams, drafts, toast, router]);

    const handleScan = async () => {
        if (!barcode.trim()) return;

        const addOrUpdateProduct = (product: Produit) => {
            const existingItemIndex = scannedItems.findIndex(item => item.produitId === product.id && item.typeQuantiteScanne === scanType);

            let newItems;
            if (existingItemIndex > -1) {
                newItems = [...scannedItems];
                newItems[existingItemIndex].qteScanne += quantity;
            } else {
                newItems = [
                    {
                        produitId: product.id,
                        nomProduit: product.nom,
                        refProduit: product.ref,
                        lieuStockNom: product.lieuStockNom || 'N/A',
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
    
    const handleSaveDraft = (name: string) => {
        let currentDraftId = activeDraftId;
        
        if (currentDraftId) {
            setDrafts(drafts.map(d => d.id === currentDraftId ? { ...d, name, items: scannedItems, date: new Date().toISOString() } : d));
            toast({ title: "Brouillon mis à jour", description: `Le brouillon "${name}" a été sauvegardé.` });
        } else {
            const newDraftId = String(Date.now());
            const newDraft = {
                id: newDraftId,
                name: name,
                date: new Date().toISOString(),
                items: scannedItems,
            };
            setDrafts(prev => [...prev, newDraft]);
            setActiveDraftId(newDraftId);
            router.replace(`/inventories/new?draft=${newDraftId}&loaded=true`, { scroll: false });
            toast({ 
                title: "Brouillon sauvegardé", 
                description: `Le brouillon "${name}" a été créé.` 
            });
        }
    };

    const handleSaveInventory = async () => {
        if (scannedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Inventaire vide', description: "Veuillez scanner au moins un produit." });
            return;
        }

        setIsSaving(true);
        const payload = {
            charge: currentUser?.email || "Utilisateur inconnu",
            produits: scannedItems.map(({ nomProduit, barcode, refProduit, ...item}) => item)
        };
        
        try {
            const newInventory = await createInventaire(payload, isFirstInventory);
            
            if (newInventory && newInventory.inventaireId) {
                if(activeDraftId) {
                    setDrafts(drafts.filter(d => d.id !== activeDraftId));
                }
                router.push(`/inventories/${newInventory.inventaireId}`);
            } else {
                 setIsSaving(false);
            }
        } catch (error) {
            setIsSaving(false);
        }
    };
    
    const activeDraft = drafts.find(d => d.id === activeDraftId);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Nouvel Inventaire</h1>
                {activeDraft && (
                    <div className="ml-4 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Brouillon: {activeDraft.name}</span>
                    </div>
                )}
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
                                                {item.qteScanne} {item.typeQuantiteScanne}
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
                        <CardFooter className="border-t pt-6 flex justify-between">
                            <Dialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={scannedItems.length === 0 || isSaving}>
                                        <FileDown className="h-4 w-4 mr-2" />
                                        {activeDraftId ? "Renommer le brouillon" : "Sauvegarder le brouillon"}
                                    </Button>
                                </DialogTrigger>
                                <SaveDraftDialog onSave={handleSaveDraft} onOpenChange={setIsDraftDialogOpen} initialName={activeDraft?.name}/>
                            </Dialog>

                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={scannedItems.length === 0 || isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Server className="h-4 w-4 mr-2" />} 
                                    {isSaving ? "Enregistrement..." : "Finaliser et envoyer"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer l'inventaire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action soumettra l'inventaire au serveur et mettra à jour les quantités en stock de {scannedItems.length} entrée(s). Cette opération est irréversible.
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
