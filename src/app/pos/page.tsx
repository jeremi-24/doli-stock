
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-provider';
import type { Produit, VenteLigne, Categorie, Vente } from '@/lib/types';
import { Plus, Minus, Search, Trash2, ShoppingCart, DollarSign, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function CheckoutDialog({
  isOpen,
  onOpenChange,
  cart,
  total,
  onCompleteSale,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cart: VenteLigne[];
  total: number;
  onCompleteSale: (details: Pick<Vente, 'client' | 'montant_paye' | 'type_paiement'>) => void;
}) {
  const [client, setClient] = useState("Vente au comptoir");
  const [montantPaye, setMontantPaye] = useState(total);
  const [typePaiement, setTypePaiement] = useState<'cash' | 'flooz' | 'tmoney' | 'carte'>('cash');
  const reste = montantPaye - total;

  const handleSubmit = () => {
    if (montantPaye < total) {
      // Allow partial payment
    }
    onCompleteSale({ client, montant_paye: montantPaye, type_paiement: typePaiement });
    onOpenChange(false);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  // Reset state when dialog opens
  useState(() => {
    if (isOpen) {
      setClient("Vente au comptoir");
      setMontantPaye(total);
      setTypePaiement('cash');
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Finaliser la Vente</DialogTitle>
          <DialogDescription>Confirmez les détails du paiement pour terminer la transaction.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">Montant Total</p>
            <p className="text-4xl font-bold">{formatCurrency(total)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Nom du Client</Label>
            <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantPaye">Montant Payé</Label>
              <Input id="montantPaye" type="number" value={montantPaye} onChange={(e) => setMontantPaye(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="typePaiement">Moyen de Paiement</Label>
                <Select value={typePaiement} onValueChange={(v) => setTypePaiement(v as any)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="tmoney">T-Money</SelectItem>
                        <SelectItem value="flooz">Flooz</SelectItem>
                        <SelectItem value="carte">Carte</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="text-center font-semibold">
            <p>Reste à payer / Monnaie : <span className={reste < 0 ? 'text-destructive' : 'text-primary'}>{formatCurrency(reste)}</span></p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <Button onClick={handleSubmit}>Valider la Vente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function POSPage() {
  const { produits, categories, addVente } = useApp();
  const { toast } = useToast();
  const [cart, setCart] = useState<VenteLigne[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Tout");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const displayCategories = useMemo(() => ['Tout', ...categories.map(c => c.nom)], [categories]);
  const categoryNameToId = useMemo(() => new Map(categories.map(c => [c.nom, c.id])), [categories]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  const filteredProducts = useMemo(() => {
    const categoryId = categoryNameToId.get(activeTab);
    return produits
      .filter(p => p.quantite_stock > 0)
      .filter(p => activeTab === 'Tout' || p.categorieId === categoryId)
      .filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [produits, activeTab, searchTerm, categoryNameToId]);

  const handleQuantityChange = (produitId: number, newQuantity: number) => {
    const produitInStock = produits.find(p => p.id === produitId);
    if (!produitInStock) return;

    if (newQuantity < 1) {
        setCart(currentCart => currentCart.filter(item => item.produit.id !== produitId));
        return;
    }

    if (newQuantity > produitInStock.quantite_stock) {
        toast({ title: "Limite de stock atteinte", variant: "destructive" });
        return; 
    }

    setCart(currentCart =>
        currentCart.map(item =>
            item.produit.id === produitId
                ? { ...item, quantite: newQuantity, prix_total: newQuantity * item.prix_unitaire }
                : item
        )
    );
  };

  const handleAddToCart = (produit: Produit) => {
    if (produit.quantite_stock <= 0) {
       toast({ title: "Rupture de stock", variant: 'destructive' });
       return;
    }
    
    const existingItem = cart.find(item => item.produit.id === produit.id);
    if (existingItem) {
      if (existingItem.quantite >= produit.quantite_stock) {
        toast({ title: "Limite de stock atteinte", variant: 'destructive' });
        return;
      }
      handleQuantityChange(produit.id, existingItem.quantite + 1);
    } else {
      const newLigne: VenteLigne = {
          id: Date.now(),
          produit: produit,
          quantite: 1,
          prix_unitaire: produit.prix_vente,
          prix_total: produit.prix_vente
      };
      setCart(currentCart => [...currentCart, newLigne]);
    }
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.prix_total, 0);
  }, [cart]);


  const handleCompleteSale = (details: Pick<Vente, 'client' | 'montant_paye' | 'type_paiement'>) => {
    addVente({
        ...details,
        lignes: cart,
        montant_total: total,
        vendeur: "Utilisateur Démo",
        type: 'pos',
    });
    toast({ title: "Vente finalisée !", description: `Total : ${formatCurrency(total)}. Le stock a été mis à jour.`});
    setCart([]);
  };

  return (
    <div className="flex flex-1 h-full">
      <div className="flex-1 p-4 md:p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-4 pt-10 md:pt-0">
          <h1 className="font-headline text-3xl font-semibold">Point de Vente</h1>
           <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4 shrink-0 flex-wrap h-auto justify-start">
            {displayCategories.map(category => (<TabsTrigger key={category} value={category}>{category}</TabsTrigger>))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pr-4">
                      {filteredProducts.map(produit => (
                          <Card key={produit.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors flex flex-col" onClick={() => handleAddToCart(produit)}>
                              <CardHeader className="p-0"><div className="aspect-square bg-muted flex items-center justify-center"><PackagePlus className="w-12 h-12 text-muted-foreground" /></div></CardHeader>
                              <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                  <div>
                                      <h3 className="font-semibold truncate text-sm">{produit.nom}</h3>
                                      <p className="text-xs text-muted-foreground">{produit.quantite_stock} en stock</p>
                                  </div>
                                  <p className="text-base text-primary font-bold mt-2">{formatCurrency(produit.prix_vente)}</p>
                              </CardContent>
                          </Card>
                      ))}
                      {filteredProducts.length === 0 && (<div className="col-span-full text-center text-muted-foreground py-10"><p>Aucun produit trouvé.</p></div>)}
                  </div>
              </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-[380px] border-l bg-card flex flex-col">
        <CardHeader className="flex-row items-center justify-between shrink-0">
          <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart className="w-6 h-6" />Panier</CardTitle>
          <CardDescription>{cart.length} article(s)</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1 min-h-0">
            <CardContent>
                {cart.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-24 text-center">Qté</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {cart.map(item => (
                                <TableRow key={item.produit.id}>
                                    <TableCell className="font-medium py-2"><p className="truncate">{item.produit.nom}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.prix_unitaire)}</p></TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produit.id, item.quantite - 1)}><Minus className="h-3 w-3"/></Button>
                                            <Input readOnly value={item.quantite} className="h-6 w-8 text-center p-0 border-0 bg-transparent focus-visible:ring-0" />
                                            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produit.id, item.quantite + 1)}><Plus className="h-3 w-3"/></Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-2">{formatCurrency(item.prix_total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10 h-full text-muted-foreground">
                        <ShoppingCart className="w-12 h-12" /><p className="mt-4 text-sm">Votre panier est vide.</p><p className="text-xs">Cliquez sur un produit pour l'ajouter.</p>
                    </div>
                )}
            </CardContent>
        </ScrollArea>
        {cart.length > 0 && (
            <div className="p-4 border-t mt-auto shrink-0">
                <div className="flex justify-between items-center font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                </div>
                <Button size="lg" className="w-full" onClick={() => setIsCheckoutOpen(true)}><DollarSign className="mr-2" /> Finaliser la Vente</Button>
            </div>
        )}
      </div>
      <CheckoutDialog isOpen={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} cart={cart} total={total} onCompleteSale={handleCompleteSale} />
    </div>
  );
}
