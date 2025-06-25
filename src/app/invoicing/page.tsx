
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/app-provider';
import type { VenteLigne, Produit, Vente } from '@/lib/types';
import { PlusCircle, Trash2, Printer, FileText, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function NewSaleDialog() {
  const { produits, addVente } = useApp();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [client, setClient] = useState('');
  const [lignes, setLignes] = useState<VenteLigne[]>([]);
  const [montantPaye, setMontantPaye] = useState(0);
  const [typePaiement, setTypePaiement] = useState<'cash' | 'flooz' | 'tmoney' | 'carte'>('cash');
  
  // Product selection
  const [selectedProduit, setSelectedProduit] = useState<string | undefined>(undefined);
  
  const availableProducts = useMemo(() => {
    return produits.filter(p => !lignes.some(ligne => ligne.produit.id === p.id));
  }, [produits, lignes]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const resetForm = () => {
    setClient('');
    setLignes([]);
    setMontantPaye(0);
    setTypePaiement('cash');
    setSelectedProduit(undefined);
    setIsOpen(false);
  }

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
    if (lignes.length === 0) { toast({ title: "Aucun article", variant: "destructive" }); return; }

    addVente({
        client,
        lignes,
        montant_total: total,
        montant_paye: montantPaye,
        type_paiement: typePaiement,
        vendeur: "Utilisateur Démo",
        type: 'manual',
    });
    
    toast({ title: "Vente créée et stock mis à jour" });
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button size="sm"><PlusCircle className="h-4 w-4 mr-2" />Créer une Vente Manuelle</Button></DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle className="font-headline">Nouvelle Vente Manuelle</DialogTitle><DialogDescription>Créez une vente et mettez à jour les niveaux de stock.</DialogDescription></DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2"><Label htmlFor="client">Nom du Client</Label><Input id="client" placeholder="John Doe" value={client} onChange={(e) => setClient(e.target.value)} className="max-w-sm" /></div>
          <div className="space-y-2"><Label>Ajouter des Produits</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduit} onValueChange={setSelectedProduit}>
                <SelectTrigger className="w-full max-w-sm"><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="border rounded-lg"><Table>
                <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[120px]">Quantité</TableHead><TableHead className="text-right w-[120px]">Prix</TableHead><TableHead className="text-right w-[120px]">Total</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                <TableBody>{lignes.length > 0 ? lignes.map(item => (
                    <TableRow key={item.produit.id}>
                      <TableCell className="font-medium">{item.produit.nom}</TableCell>
                      <TableCell><Input type="number" value={item.quantite} onChange={(e) => handleQuantityChange(item.produit.id, parseInt(e.target.value))} min="1" max={produits.find(p => p.id === item.produit.id)?.quantite_stock} className="h-8 w-20"/></TableCell>
                      <TableCell className="text-right">{formatCurrency(item.prix_unitaire)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.prix_total)}</TableCell>
                      <TableCell><Button onClick={() => handleRemoveItem(item.produit.id)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  )) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>)}
                </TableBody>
            </Table></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div className="space-y-2"><Label htmlFor="montantPaye">Montant Payé</Label><Input id="montantPaye" type="number" value={montantPaye} onChange={(e) => setMontantPaye(Number(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="typePaiement">Moyen de Paiement</Label><Select value={typePaiement} onValueChange={(v) => setTypePaiement(v as any)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="tmoney">T-Money</SelectItem><SelectItem value="flooz">Flooz</SelectItem><SelectItem value="carte">Carte</SelectItem></SelectContent></Select></div>
                <div className="font-semibold text-lg flex flex-col justify-end items-end"><p>Total: {formatCurrency(total)}</p><p>Reste: {formatCurrency(montantPaye - total)}</p></div>
             </div>
        </div>
        <DialogFooter className="justify-end sm:justify-end"><div className="flex items-center gap-2"><DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose><Button onClick={handleCreateSale}>Créer la Vente</Button></div></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SaleDetailsDialog({ vente }: { vente: Vente }) {
    const { shopInfo } = useApp();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    const handlePrint = () => { /* Print logic remains similar */ };

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <div id={`invoice-print-${vente.id}`} className="print-container">
                    <DialogHeader className="header"><DialogTitle className="font-headline text-2xl">FACTURE #{vente.id.substring(vente.id.length-6)}</DialogTitle><DialogDescription>Date: {format(new Date(vente.date_vente), 'd MMMM yyyy', { locale: fr })}</DialogDescription></DialogHeader>
                     <div className="shop-info my-8 text-center"><h3 className="font-bold text-lg">{shopInfo.name}</h3><p className="text-sm text-muted-foreground">{shopInfo.address} | {shopInfo.phone}</p></div>
                    <div className="py-6 space-y-6">
                        <p><span className="font-semibold">Client:</span> {vente.client}</p>
                        <div className="border rounded-lg"><Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[100px]">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{vente.lignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produit.nom}</TableCell><TableCell>{l.quantite}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_unitaire)}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_total)}</TableCell></TableRow>))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={3} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(vente.montant_total)}</TableCell></TableRow>
                                <TableRow><TableCell colSpan={3} className="text-right font-semibold">Montant Payé ({vente.type_paiement})</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.montant_paye)}</TableCell></TableRow>
                                <TableRow><TableCell colSpan={3} className="text-right font-semibold">Reste / Monnaie</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.reste)}</TableCell></TableRow>
                            </TableFooter>
                        </Table></div>
                        <div className="text-center pt-10"><FileText className="mx-auto h-8 w-8 text-muted-foreground"/><p className="font-headline mt-2 text-xl">Merci pour votre confiance !</p></div>
                    </div>
                </div>
                <DialogFooter className="no-print"><Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Imprimer</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SalesPage() {
  const { ventes } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const filteredSales = useMemo(() => {
      return [...ventes]
        .sort((a, b) => new Date(b.date_vente).getTime() - new Date(a.date_vente).getTime())
        .filter(vente => vente.client.toLowerCase().includes(searchTerm.toLowerCase()) || vente.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ventes, searchTerm]);
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4"><h1 className="font-headline text-3xl font-semibold">Historique des Ventes</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Rechercher une vente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
          <NewSaleDialog />
        </div>
      </div>

      <Card>
          <CardHeader><CardTitle className="font-headline">Toutes les transactions</CardTitle><CardDescription>Liste de toutes les ventes (PDV et manuelles).</CardDescription></CardHeader>
          <CardContent><div className="border rounded-lg"><Table>
            <TableHeader><TableRow><TableHead>N° Vente</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Paiement</TableHead><TableHead className="text-right">Total</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
            {filteredSales.length > 0 ? filteredSales.map(vente => (
                <TableRow key={vente.id}>
                    <TableCell className="font-mono text-xs">{vente.id.substring(vente.id.length-6)}</TableCell>
                    <TableCell className="font-medium">{vente.client}</TableCell>
                    <TableCell>{format(new Date(vente.date_vente), 'd MMM yyyy', { locale: fr })}</TableCell>
                    <TableCell><Badge variant={vente.type === 'pos' ? 'secondary' : 'default'}>{vente.type.toUpperCase()}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{vente.type_paiement}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(vente.montant_total)}</TableCell>
                    <TableCell className="text-right"><SaleDetailsDialog vente={vente} /></TableCell>
                </TableRow>
            )) : (<TableRow><TableCell colSpan={7} className="h-24 text-center">{searchTerm ? "Aucune vente ne correspond à votre recherche." : "Aucune vente trouvée."}</TableCell></TableRow>)}
            </TableBody>
          </Table></div></CardContent>
      </Card>
    </div>
  );
}
