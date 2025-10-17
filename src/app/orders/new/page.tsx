
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { LigneCommandePayload, Stock, Commande, Produit, CommandePayload } from '@/lib/types';
import { PlusCircle, Trash2, FileText, Loader2, ChevronsUpDown, Check, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

type LignePanier = {
    produitId: number;
    produitNom: string;
    produitRef: string;
    qteVoulu: number;
    prix: number;
    stockDisponible: number;
};

function ConfirmationDialog({ 
    commande,
    clientNom,
    lieuNom,
    onConfirm,
    isSaving 
} : { 
    commande: { lignes: LignePanier[], total: number }, 
    clientNom?: string, 
    lieuNom?: string, 
    onConfirm: () => void,
    isSaving: boolean
}) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    return (
        <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline">Confirmer la Commande</AlertDialogTitle>
                <AlertDialogDescription>
                    Veuillez vérifier les détails de la commande avant de la soumettre.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div><strong>Client:</strong> {clientNom || 'N/A'}</div>
                    <div><strong>Lieu de Stock:</strong> {lieuNom || 'N/A'}</div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="w-[100px] text-center">Quantité</TableHead>
                                <TableHead className="w-[120px] text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commande.lignes.map(ligne => (
                                <TableRow key={ligne.produitId}>
                                    <TableCell>{ligne.produitNom}</TableCell>
                                    <TableCell className="text-center">{ligne.qteVoulu}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(ligne.prix * ligne.qteVoulu)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-base bg-muted/50">
                                <TableCell colSpan={2} className="text-right">Total Général</TableCell>
                                <TableCell className="text-right">{formatCurrency(commande.total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmer et Envoyer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

export default function NewOrderPage() {
  const { clients, createCommande, currentUser, lieuxStock, produits, isMounted } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lieuStockId, setLieuStockId] = useState<string | undefined>(undefined);
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [pageIsReady, setPageIsReady] = useState(false);

  useEffect(() => {
    if (isMounted) {
        setPageIsReady(true);
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted && currentUser) {
      const adminRoles = ['ADMIN', 'SECRETARIAT', 'DG','COMMERCIAL','CAISSIER(ÈRE)','FISCALISTE','COMPTABLE'];
      if (!adminRoles.includes(currentUser.roleNom) && currentUser.clientId) {
        setClientId(String(currentUser.clientId));
      }
    }
  }, [isMounted, currentUser]);
  
  const canSelectClient = useMemo(() => {
    if (!isMounted || !currentUser) return false;
    const adminRoles = ['ADMIN', 'SECRETARIAT', 'DG','COMMERCIAL','CAISSIER(ÈRE)','FISCALISTE','COMPTABLE'];
    return adminRoles.includes(currentUser.roleNom);
  }, [isMounted, currentUser]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduitId) return;
    const produitInfo = produits.find(p => p.id === parseInt(selectedProduitId, 10));
    
    if (produitInfo) {
      const stockDisponible = produitInfo.quantiteTotaleGlobale ?? 0;
      const newLigne: LignePanier = {
        produitId: produitInfo.id,
        produitNom: produitInfo.nom,
        produitRef: produitInfo.ref,
        qteVoulu: 1,
        prix: produitInfo.prix || 0,
        stockDisponible: stockDisponible,
      };
      setLignes([...lignes, newLigne]);
      setSelectedProduitId(undefined);
    }
  };

  const handleRemoveItem = (produitId: number) => {
    setLignes(lignes.filter(item => item.produitId !== produitId));
  };

  const handleQuantityChange = (produitId: number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(produitId);
      return;
    }
    setLignes(lignes.map(item => item.produitId === produitId ? { ...item, qteVoulu: quantity } : item));
  };

  const total = useMemo(() => lignes.reduce((acc, item) => acc + (item.prix * item.qteVoulu), 0), [lignes]);

  const availableProducts = useMemo(() => {
    return produits
      .filter(p => !lignes.some(ligne => ligne.produitId === p.id))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [produits, lignes]);

  const handleCreateOrder = async () => {
    if (!clientId) { toast({ variant: "destructive", title: "Veuillez sélectionner un client" }); return; }
    if (!lieuStockId) { toast({ variant: "destructive", title: "Veuillez sélectionner un lieu de stock" }); return; }
    if (lignes.length === 0) { toast({ variant: "destructive", title: "Aucun article dans la commande" }); return; }

    setIsSaving(true);
    const payloadLignes: LigneCommandePayload[] = lignes.map(item => ({
        produitId: item.produitId,
        qteVoulu: item.qteVoulu,
    }));
    
    const payload: CommandePayload = {
      clientId: parseInt(clientId, 10),
      lieuStockId: parseInt(lieuStockId, 10),
      lignes: payloadLignes,
    };
    
    try {
        const newCommande = await createCommande(payload);
        if (newCommande) {
            router.push('/orders');
        }
    } catch (error) {
        // Error is handled in context and will show a specific toast
    } finally {
        setIsSaving(false);
    }
  };

  if (!pageIsReady) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32 ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
        <div className="flex-1 p-4 md:p-6 flex flex-col">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Créer une Commande</h1>
            </div>

            <Card className="mt-4 flex-1 flex flex-col">
                <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileText /> Informations de la Commande</CardTitle>
                <CardDescription>Remplissez les informations ci-dessous pour créer une nouvelle commande interne.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Client (Demandeur)</Label>
                         {pageIsReady && (
                            <Select value={clientId} onValueChange={setClientId} disabled={isSaving || !canSelectClient}>
                                <SelectTrigger id="client-select">
                                    <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                {canSelectClient ? (
                                    clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)
                                ) : (
                                    clientId && (
                                    <SelectItem value={String(clientId)}>
                                        {clients.find(c => c.id === Number(clientId))?.nom || currentUser?.email}
                                    </SelectItem>
                                    )
                                )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="lieu-select">2. Lieu de Stock</Label>
                       {pageIsReady && (
                           <Select value={lieuStockId} onValueChange={setLieuStockId} disabled={isSaving}>
                               <SelectTrigger id="lieu-select">
                                   <SelectValue placeholder="Sélectionner un lieu" />
                               </SelectTrigger>
                               <SelectContent>
                                   {lieuxStock.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}
                               </SelectContent>
                           </Select>
                       )}
                    </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                    <Label>3. Ajouter des Produits</Label>
                    <div className="flex items-center gap-2">
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                    disabled={isSaving}
                                >
                                    {selectedProduitId
                                        ? produits.find(p => String(p.id) === selectedProduitId)?.ref
                                        : "Sélectionner un produit..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher un produit..." />
                                    <CommandList>
                                        <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                                        <CommandGroup>
                                            {availableProducts.map(p => (
                                                <CommandItem
                                                    key={p.id}
                                                    value={`${p.ref} ${p.nom}`}
                                                    onSelect={() => {
                                                        setSelectedProduitId(String(p.id));
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedProduitId === String(p.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex justify-between w-full items-center">
                                                        <div>
                                                            <p className="font-semibold">{p.ref}</p>
                                                            <p className="text-xs">{p.nom}</p>
                                                        </div>
                                                        <p className="text-sm font-mono">{formatCurrency(p.prix)}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Ajouter le produit" disabled={isSaving || !selectedProduitId}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                </div>
                </CardContent>
            </Card>
        </div>

        <div className="w-[480px] border-l bg-card flex flex-col h-full">
            <CardHeader className="flex-row items-center justify-between shrink-0">
                <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Panier de Commande</CardTitle>
                <CardDescription>{lignes.length} article(s)</CardDescription>
            </CardHeader>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <CardContent>
                        {lignes.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead className="w-[120px] text-center">Quantité</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lignes.map(item => (
                                        <TableRow key={item.produitId}>
                                            <TableCell className="font-medium py-2">
                                                <p className="truncate">{item.produitNom}</p>
                                                <p className="text-xs text-muted-foreground">{item.produitRef}</p>
                                                <p className="text-xs text-muted-foreground">Stock: {item.stockDisponible}</p>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.qteVoulu - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                                    <Input type="number" value={item.qteVoulu} onChange={(e) => handleQuantityChange(item.produitId, parseInt(e.target.value))} className="h-8 w-14 text-center p-0" disabled={isSaving} min="1" />
                                                    <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.qteVoulu + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2">{formatCurrency(item.prix * item.qteVoulu)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-10 h-full text-muted-foreground">
                                <ShoppingCart className="w-12 h-12" /><p className="mt-4 text-sm">Votre panier est vide.</p><p className="text-xs">Ajoutez des produits pour commencer.</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </div>
            {lignes.length > 0 && (
                <div className="p-4 border-t shrink-0">
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="lg" className="w-full" disabled={lignes.length === 0 || !clientId || !lieuStockId || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer la Commande
                            </Button>
                        </AlertDialogTrigger>
                        {lignes.length > 0 && (
                            <ConfirmationDialog 
                                commande={{ lignes, total }}
                                clientNom={clients.find(c => c.id === Number(clientId))?.nom}
                                lieuNom={lieuxStock.find(l => l.id === Number(lieuStockId))?.nom}
                                onConfirm={handleCreateOrder}
                                isSaving={isSaving}
                            />
                        )}
                    </AlertDialog>
                </div>
            )}
        </div>
    </div>
  );
}
