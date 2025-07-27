
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { LigneCommandePayload, Stock, Commande } from '@/lib/types';
import { PlusCircle, Trash2, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type LignePanier = {
    produitId: number;
    produitNom: string;
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
                    <div><strong>Lieu de Livraison:</strong> {lieuNom || 'N/A'}</div>
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
                        <TableRow className="font-bold text-base bg-muted/50">
                            <TableCell colSpan={2} className="text-right">Total Général</TableCell>
                            <TableCell className="text-right">{formatCurrency(commande.total)}</TableCell>
                        </TableRow>
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
  const { clients, createCommande, currentUser, lieuxStock, isMounted } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isStockLoading, setIsStockLoading] = useState(false);

  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lieuLivraisonId, setLieuLivraisonId] = useState<string | undefined>(undefined);
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchStocks() {
        if (!lieuLivraisonId) {
            setStocks([]);
            return;
        }
        setIsStockLoading(true);
        try {
            // Note: Assuming an API endpoint to get stock per location exists
            // If not, we might need to filter the global stock list client-side
            const allStocks = await api.getStocks(); 
            const filtered = allStocks.filter(s => s.lieuStockId === Number(lieuLivraisonId));
            setStocks(filtered);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le stock pour ce lieu.' });
        } finally {
            setIsStockLoading(false);
        }
    }
    fetchStocks();
  }, [lieuLivraisonId, toast]);

  const availableProducts = useMemo(() => {
    if (!lieuLivraisonId) return [];
    return stocks
      .filter(s => s.produitId && !lignes.some(ligne => ligne.produitId === s.produitId));
  }, [stocks, lignes, lieuLivraisonId]);

  const canSelectClient = useMemo(() => {
      if (!currentUser || !currentUser.roleNom) return false;
      const adminRoles = ['ADMIN', 'SECRETARIAT', 'DG'];
      return adminRoles.includes(currentUser.roleNom);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !canSelectClient && currentUser.clientId) {
      setClientId(String(currentUser.clientId));
    }
  }, [currentUser, canSelectClient]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduitId) return;
    const stockInfo = stocks.find(s => s.produitId === parseInt(selectedProduitId, 10));
    if (stockInfo && stockInfo.produit) {
      if (stockInfo.quantiteTotale <= 0) {
        toast({ title: "Rupture de stock", variant: "destructive", description: "Ce produit n'est pas disponible dans ce lieu." });
        return;
      }
      const newLigne: LignePanier = {
        produitId: stockInfo.produitId,
        produitNom: stockInfo.produitNom,
        qteVoulu: 1,
        prix: stockInfo.produit.prix || 0,
        stockDisponible: stockInfo.quantiteTotale,
      };
      setLignes([...lignes, newLigne]);
      setSelectedProduitId(undefined);
    }
  };

  const handleRemoveItem = (produitId: number) => {
    setLignes(lignes.filter(item => item.produitId !== produitId));
  };

  const handleQuantityChange = (produitId: number, quantity: number) => {
    const ligne = lignes.find(l => l.produitId === produitId);
    if (ligne && quantity > ligne.stockDisponible) {
      toast({ title: "Limite de stock dépassée", variant: "destructive", description: `Stock disponible: ${ligne.stockDisponible}` });
      return;
    }
    if (quantity < 1) {
      handleRemoveItem(produitId);
      return;
    }
    setLignes(lignes.map(item => item.produitId === produitId ? { ...item, qteVoulu: quantity } : item));
  };

  const total = useMemo(() => lignes.reduce((acc, item) => acc + (item.prix * item.qteVoulu), 0), [lignes]);

  const handleCreateOrder = async () => {
    if (!clientId) { toast({ variant: "destructive", title: "Veuillez sélectionner un client" }); return; }
    if (!lieuLivraisonId) { toast({ variant: "destructive", title: "Veuillez sélectionner un lieu de livraison" }); return; }
    if (lignes.length === 0) { toast({ variant: "destructive", title: "Aucun article dans la commande" }); return; }

    setIsSaving(true);
    const payloadLignes: LigneCommandePayload[] = lignes.map(item => ({
        produitId: item.produitId,
        qteVoulu: item.qteVoulu,
    }));
    
    try {
        const newCommande = await createCommande({
            clientId: parseInt(clientId, 10),
            lieuLivraisonId: parseInt(lieuLivraisonId, 10),
            lignes: payloadLignes,
        });
        if (newCommande) {
            router.push('/orders');
        }
    } catch (error) {
        // Error is handled in context and will show a specific toast
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Créer une Commande</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><FileText /> Nouvelle Commande</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer une nouvelle commande interne.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client-select">1. Client (Demandeur)</Label>
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
            </div>
            <div className="space-y-2">
               <Label htmlFor="lieu-select">2. Lieu de Livraison (Stock)</Label>
               <Select value={lieuLivraisonId} onValueChange={setLieuLivraisonId} disabled={isSaving}>
                  <SelectTrigger id="lieu-select">
                    <SelectValue placeholder="Sélectionner un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {lieuxStock.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <Label>3. Ajouter des Produits</Label>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedProduitId} 
                onValueChange={setSelectedProduitId} 
                disabled={isSaving || !lieuLivraisonId || isStockLoading}
              >
                <SelectTrigger>
                    <SelectValue placeholder={!lieuLivraisonId ? "Sélectionnez d'abord un lieu" : (isStockLoading ? "Chargement du stock..." : "Sélectionner un produit")} />
                </SelectTrigger>
                <SelectContent>
                    {availableProducts.map(s => 
                        <SelectItem key={s.produitId} value={String(s.produitId)}>
                            {s.produitNom} ({s.quantiteTotale} en stock)
                        </SelectItem>
                    )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Ajouter le produit" disabled={isSaving || !selectedProduitId || isStockLoading}><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-[150px]">Quantité</TableHead>
                  <TableHead className="text-right w-[120px]">Prix</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"><span className="sr-only">Supprimer</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.length > 0 ? lignes.map(item => (
                  <TableRow key={item.produitId}>
                    <TableCell className="font-medium">{item.produitNom}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.qteVoulu} 
                        onChange={(e) => handleQuantityChange(item.produitId, parseInt(e.target.value))} 
                        min="1" 
                        max={item.stockDisponible} 
                        className="h-8 w-24" 
                        disabled={isSaving}
                      />
                      <span className="text-xs text-muted-foreground ml-2">/ {item.stockDisponible}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix * item.qteVoulu)}</TableCell>
                    <TableCell><Button onClick={() => handleRemoveItem(item.produitId)} variant="ghost" size="icon" aria-label="Supprimer" disabled={isSaving}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end border-t pt-4">
            <div className="font-semibold text-lg flex flex-col items-end gap-1 w-full max-w-xs">
              <div className="flex justify-between w-full"><span>Total:</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/orders')} disabled={isSaving}>Annuler</Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button disabled={lignes.length === 0 || !clientId || !lieuLivraisonId || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Créer la Commande
                    </Button>
                </AlertDialogTrigger>
                {lignes.length > 0 && (
                    <ConfirmationDialog 
                        commande={{ lignes, total }}
                        clientNom={clients.find(c => c.id === Number(clientId))?.nom}
                        lieuNom={lieuxStock.find(l => l.id === Number(lieuLivraisonId))?.nom}
                        onConfirm={handleCreateOrder}
                        isSaving={isSaving}
                    />
                )}
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
