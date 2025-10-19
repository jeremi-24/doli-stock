
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { LigneCommandePayload, CommandePayload, Produit } from '@/lib/types';
import { Plus, Minus, Trash2, FileText, Loader2, ShoppingCart, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn, normalizeString } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

type LignePanier = {
    produitId: number;
    produitNom: string;
    produitRef: string;
    qteVoulu: number;
    prix: number;
    prixPersonnalise?: number;
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
                                    <TableCell className="text-right">{formatCurrency((ligne.prixPersonnalise ?? ligne.prix) * ligne.qteVoulu)}</TableCell>
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
  const { clients, createCommande, currentUser, lieuxStock, produits, isMounted, hasPermission } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lieuStockId, setLieuStockId] = useState<string | undefined>(undefined);
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageIsReady, setPageIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const canChangePrice = useMemo(() => hasPermission('AJOUT_PRIX_PERSONNALISE'), [hasPermission]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = (produitInfo: Produit) => {
    if (lignes.some(item => item.produitId === produitInfo.id)) {
        handleQuantityChange(produitInfo.id, (lignes.find(item => item.produitId === produitInfo.id)?.qteVoulu || 0) + 1);
        return;
    }
    
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

  const handlePriceChange = (produitId: number, newPrice: number) => {
    setLignes(lignes.map(item => item.produitId === produitId ? { ...item, prixPersonnalise: newPrice >= 0 ? newPrice : 0 } : item));
  };

  const total = useMemo(() => lignes.reduce((acc, item) => acc + ((item.prixPersonnalise ?? item.prix) * item.qteVoulu), 0), [lignes]);

  const availableProducts = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    return produits
      .filter(p => {
        if (!normalizedSearch) return true;
        const searchableString = normalizeString(`${p.nom} ${p.ref}`);
        return searchableString.includes(normalizedSearch);
      })
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [produits, searchTerm]);

  const handleCreateOrder = async () => {
    if (!clientId) { toast({ variant: "destructive", title: "Veuillez sélectionner un client" }); return; }
    if (!lieuStockId) { toast({ variant: "destructive", title: "Veuillez sélectionner un lieu de stock" }); return; }
    if (lignes.length === 0) { toast({ variant: "destructive", title: "Aucun article dans la commande" }); return; }

    setIsSaving(true);
    const payloadLignes: LigneCommandePayload[] = lignes.map(item => ({
        produitId: item.produitId,
        qteVoulu: item.qteVoulu,
        prixPersonnalise: item.prixPersonnalise,
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
        <div className="grid md:grid-cols-2 gap-6 h-full">
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
        <div className="flex-1 p-4 md:p-6 flex flex-col">
            <h1 className="font-headline text-3xl font-semibold">Créer une Commande</h1>
            <Card className="mt-4 flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileText /> Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="client-select">1. Client (Demandeur)</Label>
                            <Select value={clientId} onValueChange={setClientId} disabled={isSaving || !canSelectClient}>
                                <SelectTrigger id="client-select"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                                <SelectContent>
                                    {canSelectClient ? (
                                        clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)
                                    ) : (
                                        clientId && <SelectItem value={String(clientId)}>{clients.find(c => c.id === Number(clientId))?.nom || currentUser?.email}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lieu-select">2. Lieu de Stock (Prélèvement)</Label>
                            <Select value={lieuStockId} onValueChange={setLieuStockId} disabled={isSaving}>
                                <SelectTrigger id="lieu-select"><SelectValue placeholder="Sélectionner un lieu" /></SelectTrigger>
                                <SelectContent>{lieuxStock.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>

                <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
                    <Label className="mb-2">3. Ajouter des Produits</Label>
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher un produit par nom ou référence..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/>
                    </div>
                    <ScrollArea className="flex-1 border rounded-md">
                        <div className="p-2 grid grid-cols-2 xl:grid-cols-3 gap-2">
                            {availableProducts.map(p => (
                                <Card 
                                    key={p.id}
                                    onClick={() => handleAddItem(p)}
                                    className={cn("cursor-pointer hover:bg-muted/50 transition-colors", lignes.some(l => l.produitId === p.id) && "border-primary ring-1 ring-primary")}
                                >
                                    <CardContent className="p-3">
                                        <p className="font-semibold truncate">{p.nom}</p>
                                        <p className="text-xs text-muted-foreground">{p.ref}</p>
                                        <p className="text-sm font-bold mt-1">{formatCurrency(p.prix)}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </Card>
        </div>

        <aside className="w-[480px] border-l bg-muted/20 flex flex-col h-full">
            <CardHeader className="shrink-0">
                <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Panier ({lignes.length})</CardTitle>
                <CardDescription>Produits de la commande en cours.</CardDescription>
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
                                            <TableCell className="font-medium py-2 align-top">
                                                <p className="truncate">{item.produitNom}</p>
                                                <p className="text-xs text-muted-foreground">{item.produitRef}</p>
                                                {canChangePrice ? (
                                                  <Input type="number" 
                                                    value={item.prixPersonnalise ?? item.prix}
                                                    onChange={(e) => handlePriceChange(item.produitId, Number(e.target.value))}
                                                    className="h-7 mt-1 text-xs"
                                                    placeholder="Prix personnalisé"
                                                  />
                                                ) : (
                                                  <p className="text-xs text-muted-foreground">{formatCurrency(item.prix)}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Stock: {item.stockDisponible}</p>
                                            </TableCell>
                                            <TableCell className="py-2 align-top">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.qteVoulu - 1)} disabled={isSaving}><Minus className="h-3 w-3"/></Button>
                                                    <Input type="number" value={item.qteVoulu} onChange={(e) => handleQuantityChange(item.produitId, parseInt(e.target.value))} className="h-8 w-14 text-center p-0" disabled={isSaving} min="1" />
                                                    <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produitId, item.qteVoulu + 1)} disabled={isSaving}><Plus className="h-3 w-3"/></Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2 align-top font-semibold">{formatCurrency((item.prixPersonnalise ?? item.prix) * item.qteVoulu)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-10 h-full text-muted-foreground">
                                <ShoppingCart className="w-12 h-12" /><p className="mt-4 text-sm">Votre panier est vide.</p><p className="text-xs">Cliquez sur un produit pour commencer.</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </div>
            {lignes.length > 0 && (
                <CardFooter className="p-4 border-t shrink-0 bg-background">
                    <div className="w-full">
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
                            <ConfirmationDialog 
                                commande={{ lignes, total }}
                                clientNom={clients.find(c => c.id === Number(clientId))?.nom}
                                lieuNom={lieuxStock.find(l => l.id === Number(lieuStockId))?.nom}
                                onConfirm={handleCreateOrder}
                                isSaving={isSaving}
                            />
                        </AlertDialog>
                    </div>
                </CardFooter>
            )}
        </aside>
    </div>
  );
}

    