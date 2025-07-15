
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { VenteLigne, VentePayload } from '@/lib/types';
import { PlusCircle, Trash2, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function InvoicingPage() {
  const { produits, clients, addVente, currentUser } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lignes, setLignes] = useState<VenteLigne[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  
  const availableProducts = useMemo(() => {
    return produits.filter(p => !lignes.some(ligne => ligne.produit.id === p.id));
  }, [produits, lignes]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduit) return;
    const produitToAdd = produits.find(p => p.id === parseInt(selectedProduit, 10));
    if (produitToAdd) {
      if (produitToAdd.qte < 1) {
        toast({ title: "Rupture de stock", variant: "destructive" });
        return;
      }
      const newLigne: VenteLigne = {
        id: Date.now(),
        produit: produitToAdd,
        quantite: 1,
        prix_unitaire: produitToAdd.prix,
        prix_total: produitToAdd.prix,
      };
      setLignes([...lignes, newLigne]);
      setSelectedProduit(undefined);
    }
  };

  const handleRemoveItem = (produitId: number) => {
    setLignes(lignes.filter(item => item.produit.id !== produitId));
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
    setLignes(lignes.map(item => item.produit.id === produitId ? { ...item, quantite: quantity, prix_total: quantity * item.prix_unitaire } : item));
  };

  const total = useMemo(() => lignes.reduce((acc, item) => acc + item.prix_total, 0), [lignes]);

  const handleCreateSale = async () => {
    if (!clientId) { toast({ title: "Veuillez sélectionner un client", variant: "destructive" }); return; }
    if (lignes.length === 0) { toast({ title: "Aucun article dans la facture", variant: "destructive" }); return; }

    setIsSaving(true);
    const payload: VentePayload = {
      ref: `MAN-${Date.now().toString().slice(-8)}`,
      caissier: currentUser?.email || 'Inconnu',
      clientId: parseInt(clientId, 10),
      lignes: lignes.map(item => ({
        produitId: item.produit.id,
        produitNom: item.produit.nom,
        qteVendu: item.quantite,
        produitPrix: item.prix_unitaire,
        total: item.prix_total,
      })),
    };
    
    try {
        await addVente(payload);
        toast({ title: "Vente créée avec succès", description: "Le stock a été mis à jour." });
        router.push('/sales');
    } catch (error) {
        // error is handled by the context provider
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Créer une Vente Manuelle</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><FileText /> Nouvelle Vente</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer une nouvelle vente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="client-select">Client</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={isSaving}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Ajouter des Produits</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduit} onValueChange={setSelectedProduit} disabled={isSaving}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Ajouter le produit" disabled={isSaving}><PlusCircle className="h-4 w-4" /></Button>
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
                  <TableRow key={item.produit.id}>
                    <TableCell className="font-medium">{item.produit.nom}</TableCell>
                    <TableCell><Input type="number" value={item.quantite} onChange={(e) => handleQuantityChange(item.produit.id, parseInt(e.target.value))} min="1" max={produits.find(p => p.id === item.produit.id)?.qte} className="h-8 w-20" disabled={isSaving}/></TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix_unitaire)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix_total)}</TableCell>
                    <TableCell><Button onClick={() => handleRemoveItem(item.produit.id)} variant="ghost" size="icon" aria-label="Supprimer" disabled={isSaving}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
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
            <Button variant="ghost" onClick={() => router.push('/sales')} disabled={isSaving}>Annuler</Button>
            <Button onClick={handleCreateSale} disabled={lignes.length === 0 || !clientId || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Enregistrement...' : 'Enregistrer la Vente'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
