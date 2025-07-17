
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { LigneCommandePayload } from '@/lib/types';
import { PlusCircle, Trash2, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type LignePanier = {
    produitId: number;
    produitNom: string;
    qteVoulu: number;
    prix: number;
};

export default function NewOrderPage() {
  const { produits, clients, createCommande, currentUser } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  
  const availableProducts = useMemo(() => {
    return produits.filter(p => !lignes.some(ligne => ligne.produitId === p.id));
  }, [produits, lignes]);

  const genericClient = useMemo(() => {
    if (!clients) return null;
    return clients.find(c => c.nom.toUpperCase() === 'CLIENT GENERIQUE');
  }, [clients]);

  useEffect(() => {
      if (currentUser && genericClient && currentUser.role?.nom !== 'ADMIN' && currentUser.role?.nom !== 'SECRETARIAT' && currentUser.role?.nom !== 'DG') {
          setClientId(String(genericClient.id));
      }
  }, [currentUser, genericClient]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduitId) return;
    const produitToAdd = produits.find(p => p.id === parseInt(selectedProduitId, 10));
    if (produitToAdd) {
      if (produitToAdd.qte < 1) {
        toast({ title: "Rupture de stock", variant: "destructive", description: "Ce produit n'est pas disponible." });
        return;
      }
      const newLigne: LignePanier = {
        produitId: produitToAdd.id,
        produitNom: produitToAdd.nom,
        qteVoulu: 1,
        prix: produitToAdd.prix,
      };
      setLignes([...lignes, newLigne]);
      setSelectedProduitId(undefined);
    }
  };

  const handleRemoveItem = (produitId: number) => {
    setLignes(lignes.filter(item => item.produitId !== produitId));
  };

  const handleQuantityChange = (produitId: number, quantity: number) => {
    const produitInStock = produits.find(p => p.id === produitId);
    if (produitInStock && quantity > produitInStock.qte) {
      toast({ title: "Limite de stock dépassée", variant: "destructive" });
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
    if (lignes.length === 0) { toast({ variant: "destructive", title: "Aucun article dans la commande" }); return; }

    setIsSaving(true);
    const payloadLignes: LigneCommandePayload[] = lignes.map(item => ({
        produitId: item.produitId,
        qteVoulu: item.qteVoulu,
    }));
    
    try {
        const newCommande = await createCommande({
            clientId: parseInt(clientId, 10),
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

  const canSelectClient = currentUser?.role?.nom === 'ADMIN' || currentUser?.role?.nom === 'SECRETARIAT' || currentUser?.role?.nom === 'DG';

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
              <Label htmlFor="client-select">Client (Demandeur)</Label>
               <Select value={clientId} onValueChange={setClientId} disabled={isSaving || !canSelectClient}>
                  <SelectTrigger id="client-select">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {canSelectClient ? (
                       clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)
                    ) : (
                      <SelectItem value={clientId || ''}>{currentUser?.email}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Ajouter des Produits</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduitId} onValueChange={setSelectedProduitId} disabled={isSaving}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Ajouter le produit" disabled={isSaving || !selectedProduitId}><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-[120px]">Quantité</TableHead>
                  <TableHead className="text-right w-[120px]">Prix</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"><span className="sr-only">Supprimer</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.length > 0 ? lignes.map(item => (
                  <TableRow key={item.produitId}>
                    <TableCell className="font-medium">{item.produitNom}</TableCell>
                    <TableCell><Input type="number" value={item.qteVoulu} onChange={(e) => handleQuantityChange(item.produitId, parseInt(e.target.value))} min="1" max={produits.find(p => p.id === item.produitId)?.qte} className="h-8 w-20" disabled={isSaving}/></TableCell>
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
            <Button onClick={handleCreateOrder} disabled={lignes.length === 0 || !clientId || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Création...' : 'Créer la Commande'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
