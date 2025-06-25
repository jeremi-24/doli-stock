
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { VenteLigne, Produit } from '@/lib/types';
import { PlusCircle, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function InvoicingPage() {
  const { produits, addVente, factureModeles } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [client, setClient] = useState('');
  const [lignes, setLignes] = useState<VenteLigne[]>([]);
  const [montantPaye, setMontantPaye] = useState(0);
  const [typePaiement, setTypePaiement] = useState<'cash' | 'flooz' | 'tmoney' | 'carte'>('cash');
  const [selectedModeleId, setSelectedModeleId] = useState<string | undefined>(factureModeles[0]?.id);
  
  const [selectedProduit, setSelectedProduit] = useState<string | undefined>(undefined);
  
  const availableProducts = useMemo(() => {
    return produits.filter(p => !lignes.some(ligne => ligne.produit.id === p.id));
  }, [produits, lignes]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduit) return;
    const produitToAdd = produits.find(p => p.id === selectedProduit);
    if (produitToAdd) {
      if (produitToAdd.quantite_stock < 1) {
        toast({ title: "Rupture de stock", variant: "destructive" });
        return;
      }
      const newLigne: VenteLigne = {
        id: `ligne-${Date.now()}`,
        produit: produitToAdd,
        quantite: 1,
        prix_unitaire: produitToAdd.prix_vente,
        prix_total: produitToAdd.prix_vente,
      };
      setLignes([...lignes, newLigne]);
      setSelectedProduit(undefined);
    }
  };

  const handleRemoveItem = (produitId: string) => {
    setLignes(lignes.filter(item => item.produit.id !== produitId));
  };

  const handleQuantityChange = (produitId: string, quantity: number) => {
    const produitInStock = produits.find(p => p.id === produitId);
    if (produitInStock && quantity > produitInStock.quantite_stock) {
      toast({ title: "Limite de stock dépassée", variant: "destructive" });
      return;
    }
    if (quantity < 1) {
      handleRemoveItem(produitId);
      return;
    }
    setLignes(lignes.map(item => item.produit.id === produitId ? { ...item, quantite, prix_total: quantity * item.prix_unitaire } : item));
  };

  const total = useMemo(() => lignes.reduce((acc, item) => acc + item.prix_total, 0), [lignes]);

  const handleCreateSale = () => {
    if (!client.trim()) { toast({ title: "Nom du client requis", variant: "destructive" }); return; }
    if (lignes.length === 0) { toast({ title: "Aucun article dans la facture", variant: "destructive" }); return; }

    addVente({
        client,
        lignes,
        montant_total: total,
        montant_paye: montantPaye,
        type_paiement: typePaiement,
        vendeur: "Utilisateur Démo",
        type: 'manual',
        facture_modele_id: selectedModeleId,
    });
    
    toast({ title: "Facture créée avec succès", description: "Le stock a été mis à jour." });
    router.push('/sales');
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Créer une Facture</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><FileText /> Nouvelle Facture Manuelle</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer une nouvelle facture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client">Nom du Client</Label>
              <Input id="client" placeholder="Ex: John Doe" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="factureModele">Modèle de Facture</Label>
              <Select value={selectedModeleId} onValueChange={setSelectedModeleId}>
                <SelectTrigger id="factureModele">
                  <SelectValue placeholder="Choisir un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  {factureModeles.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Ajouter des Produits à la Facture</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduit} onValueChange={setSelectedProduit}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Ajouter le produit"><PlusCircle className="h-4 w-4" /></Button>
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
                    <TableCell><Input type="number" value={item.quantite} onChange={(e) => handleQuantityChange(item.produit.id, parseInt(e.target.value))} min="1" max={produits.find(p => p.id === item.produit.id)?.quantite_stock} className="h-8 w-20"/></TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix_unitaire)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.prix_total)}</TableCell>
                    <TableCell><Button onClick={() => handleRemoveItem(item.produit.id)} variant="ghost" size="icon" aria-label="Supprimer"><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="montantPaye">Montant Payé</Label>
              <Input id="montantPaye" type="number" value={montantPaye} onChange={(e) => setMontantPaye(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typePaiement">Moyen de Paiement</Label>
              <Select value={typePaiement} onValueChange={(v) => setTypePaiement(v as any)}>
                <SelectTrigger id="typePaiement"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="tmoney">T-Money</SelectItem>
                  <SelectItem value="flooz">Flooz</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-semibold text-lg flex flex-col justify-end items-end gap-1">
              <div className="flex justify-between w-full max-w-xs"><span>Total:</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between w-full max-w-xs"><span>Reste:</span><span>{formatCurrency(total - montantPaye)}</span></div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/sales')}>Annuler</Button>
            <Button onClick={handleCreateSale} disabled={lignes.length === 0 || !client.trim()}>Créer la Facture</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
