
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-provider';
import type { Produit, Categorie, Client, VentePayload } from '@/lib/types';
import { TypePaiement, ModePaiement } from '@/lib/types';
import * as api from '@/lib/api';
import { Plus, Minus, Search, Trash2, ShoppingCart, DollarSign, PackagePlus, Loader2, Package, Archive, AlertTriangle, Box as CartonIcon, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type VenteLignePanier = {
    id: number;
    produit: Produit;
    quantite: number;
    prix_unitaire: number;
    prix_total: number;
    type: 'UNITE' | 'CARTON';
};

function ScanSelectionDialog({
    isOpen,
    onOpenChange,
    produit,
    onSelect,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    produit: Produit | null;
    onSelect: (type: 'UNITE' | 'CARTON') => void;
}) {
    if (!produit) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Comment souhaitez-vous vendre : {produit.nom}</DialogTitle>
                    <DialogDescription> </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex justify-around gap-4">
                    <Button 
                        size="lg" 
                        className="flex-1"
                        onClick={() => onSelect('UNITE')}
                    >
                        <Package className="mr-2 h-5 w-5"/>
                        Vendre l'unité
                    </Button>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        className="flex-1"
                        onClick={() => onSelect('CARTON')}
                        disabled={!produit.prixCarton}
                    >
                         <CartonIcon className="mr-2 h-5 w-5"/>
                      Vendre le carton
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CheckoutDialog({
  isOpen,
  onOpenChange,
  total,
  onCompleteSale,
  isSaving,
  clients,
  defaultClientId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onCompleteSale: (details: { clientId: number, typePaiement: TypePaiement, paiementInitial?: { montant: number, modePaiement: ModePaiement, reference?: string } }) => void;
  isSaving: boolean;
  clients: Client[];
  defaultClientId?: number;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [typePaiement, setTypePaiement] = useState<TypePaiement>(TypePaiement.COMPTANT);
  const [montantInitial, setMontantInitial] = useState(0);
  const [modePaiement, setModePaiement] = useState<ModePaiement>(ModePaiement.ESPECE);
  const [reference, setReference] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(defaultClientId ? String(defaultClientId) : undefined);
      setTypePaiement(TypePaiement.COMPTANT);
      setMontantInitial(total);
      setModePaiement(ModePaiement.ESPECE);
      setReference("");
    }
  }, [isOpen, defaultClientId, total]);

  useEffect(() => {
    if (typePaiement === TypePaiement.COMPTANT) {
      setMontantInitial(total);
    }
  }, [typePaiement, total]);

  const handleSubmit = () => {
    if (!selectedClientId) {
        toast({variant: 'destructive', title: "Veuillez sélectionner un client."})
        return;
    }

    const paiementInitial = {
        montant: montantInitial,
        modePaiement: modePaiement,
        reference: reference
    };

    onCompleteSale({ 
        clientId: parseInt(selectedClientId, 10), 
        typePaiement,
        paiementInitial: typePaiement === TypePaiement.COMPTANT || montantInitial > 0 ? paiementInitial : undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Finaliser la Vente</DialogTitle>
          <DialogDescription>Confirmez les détails pour terminer la transaction.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">Montant Total</p>
            <p className="text-4xl font-bold">{formatCurrency(total)}</p>
          </div>
          <div className="space-y-2">
            <Label>Type de Paiement</Label>
            <RadioGroup value={typePaiement} onValueChange={(v) => setTypePaiement(v as TypePaiement)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={TypePaiement.COMPTANT} id="comptant"/><Label htmlFor="comptant">Comptant</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={TypePaiement.CREDIT} id="credit"/><Label htmlFor="credit">Crédit</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-select">Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isSaving}>
              <SelectTrigger id="client-select"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={String(client.id)}>{client.nom}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {typePaiement === TypePaiement.CREDIT && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montant-initial">Paiement initial</Label>
                <Input id="montant-initial" type="number" value={montantInitial} onChange={e => setMontantInitial(Number(e.target.value))} max={total} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode-paiement">Mode</Label>
                <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as ModePaiement)}>
                    <SelectTrigger id="mode-paiement"><SelectValue placeholder="Mode"/></SelectTrigger>
                    <SelectContent>
                        {Object.values(ModePaiement).map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={isSaving}>Annuler</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving || !selectedClientId}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Sauvegarde..." : "Valider la Vente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function POSPage() {
  const { produits, categories, clients, currentUser, createVente } = useApp();
  const { toast } = useToast();
  const [cart, setCart] = useState<VenteLignePanier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Tout");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [scannedProductForSelection, setScannedProductForSelection] = useState<Produit | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);


  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const displayCategories = useMemo(() => ['Tout', ...categories.map(c => c.nom)], [categories]);
  const categoryNameToId = useMemo(() => new Map(categories.map(c => [c.nom, c.id])), [categories]);
  
  const defaultClient = useMemo(() => {
    if (!clients || clients.length === 0) return undefined;
    return clients.find(c => c.nom && c.nom.toUpperCase() === 'CLIENT GENERIQUE');
  }, [clients]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  const filteredProducts = useMemo(() => {
    const categoryId = categoryNameToId.get(activeTab);
    return produits
      .filter(p => activeTab === 'Tout' || p.categorieId === categoryId)
      .filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [produits, activeTab, searchTerm, categoryNameToId]);
  
  const handleQuantityChange = (produitId: number, type: 'UNITE' | 'CARTON', newQuantity: number) => {
    const produitInStock = produits.find(p => p.id === produitId);
    if (!produitInStock) return;
  
    if (newQuantity < 0) return;
  
    const stockTotalUnites = produitInStock.quantiteTotaleGlobale ?? 0;
    const qteParCarton = produitInStock.qteParCarton || 1;
  
    const qteEnUnitesDansPanier = cart
        .filter(item => item.produit.id === produitId)
        .reduce((total, item) => total + (item.quantite * (item.type === 'CARTON' ? qteParCarton : 1)), 0);
    
    const qteActuellePourCeType = cart.find(item => item.produit.id === produitId && item.type === type)?.quantite || 0;
    const diff = newQuantity - qteActuellePourCeType;
    const diffEnUnites = diff * (type === 'CARTON' ? qteParCarton : 1);
  
    if (qteEnUnitesDansPanier + diffEnUnites > stockTotalUnites) {
        toast({ title: "Limite de stock atteinte", variant: "destructive", description: `Stock disponible: ${stockTotalUnites} unités.` });
        return;
    }
  
    const existingItem = cart.find(item => item.produit.id === produitId && item.type === type);
  
    if (newQuantity === 0) {
      setCart(currentCart => currentCart.filter(item => !(item.produit.id === produitId && item.type === type)));
    } else if (existingItem) {
      setCart(currentCart => currentCart.map(item =>
        item.produit.id === produitId && item.type === type
          ? { ...item, quantite: newQuantity, prix_total: newQuantity * item.prix_unitaire }
          : item
      ));
    } else { 
      const newItem: VenteLignePanier = {
        id: Date.now(),
        produit: produitInStock,
        quantite: newQuantity,
        type: type,
        prix_unitaire: type === 'CARTON' ? (produitInStock.prixCarton || 0) : (produitInStock.prix || 0),
        prix_total: newQuantity * (type === 'CARTON' ? (produitInStock.prixCarton || 0) : (produitInStock.prix || 0)),
      };
      setCart(currentCart => [...currentCart, newItem]);
    }
  };


  const handleAddToCart = (produit: Produit, type: 'UNITE' | 'CARTON') => {
    const stock = produit.quantiteTotaleGlobale ?? 0;
    if (stock <= 0 && !cart.some(item => item.produit.id === produit.id)) {
       toast({ title: "Rupture de stock", variant: 'destructive', description: "Ce produit ne peut pas être ajouté au panier." });
       return;
    }
    
    const existingItem = cart.find(item => item.produit.id === produit.id && item.type === type);
    
    if (existingItem) {
      handleQuantityChange(produit.id, type, existingItem.quantite + 1);
    } else {
      const prix = type === 'CARTON' ? (produit.prixCarton || 0) : (produit.prix || 0);
      const qteParCarton = produit.qteParCarton || 1;

      const qteEnUnitesDansPanier = cart
        .filter(item => item.produit.id === produit.id)
        .reduce((total, item) => total + (item.quantite * (item.type === 'CARTON' ? qteParCarton : 1)), 0);
      
      const qteAjoutEnUnites = type === 'CARTON' ? qteParCarton : 1;

      if(qteEnUnitesDansPanier + qteAjoutEnUnites > stock) {
         toast({ title: "Limite de stock atteinte", variant: "destructive", description: `Stock disponible: ${stock} unités.` });
         return;
      }

      const newLigne: VenteLignePanier = {
          id: Date.now(),
          produit: produit,
          quantite: 1,
          prix_unitaire: prix,
          prix_total: prix,
          type: type
      };
      setCart(currentCart => [...currentCart, newLigne]);
    }
  };

  const handleScan = async () => {
    if (!barcode.trim()) return;

    setScanError(null);
    setIsScanning(true);

    try {
        const product = await api.getProductByBarcode(barcode);
        if (product && product.id) {
            setScannedProductForSelection(product);
            setIsSelectionModalOpen(true);
        } else {
            setScanError(`Produit non trouvé pour le code-barres : ${barcode}`);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
        setScanError(errorMessage);
    } finally {
        setIsScanning(false);
        setBarcode("");
    }
  };

  const handleSelectionFromModal = (type: 'UNITE' | 'CARTON') => {
    if (scannedProductForSelection) {
        handleAddToCart(scannedProductForSelection, type);
        toast({ title: "Produit ajouté", description: `${scannedProductForSelection.nom} (${type})` });
    }
    setIsSelectionModalOpen(false);
    setScannedProductForSelection(null);
    barcodeInputRef.current?.focus();
  };


  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.prix_total, 0);
  }, [cart]);


  const handleCompleteSale = async (details: { clientId: number, typePaiement: TypePaiement, paiementInitial?: { montant: number, modePaiement: ModePaiement, reference?: string } }) => {
    if (!currentUser || !currentUser.lieuStockId) {
        toast({ variant: 'destructive', title: "Erreur", description: "Lieu de stock de l'utilisateur non défini." });
        return;
    }
    
    setIsSaving(true);
    
    const payload: VentePayload = {
        caissier: currentUser.email,
        lieuStockId: currentUser.lieuStockId,
        clientId: details.clientId,
        typePaiement: details.typePaiement,
        lignes: cart.map(item => ({
            codeProduit: item.produit.codeBarre,
            qteVendueDansLigne: item.quantite,
            typeQuantite: item.type,
        })),
        paiementInitial: details.paiementInitial
    };

    try {
        await createVente(payload);
        setCart([]);
        setIsCheckoutOpen(false);
    } catch (error) {
         // Error is handled in context
    } finally {
        setIsSaving(false);
    }
  };

  const StockBadge = ({ qte, qteMin }: { qte: number, qteMin: number }) => {
    const qteNum = qte || 0;
    const qteMinNum = qteMin || 0;
    if (qteNum <= 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Archive className="h-3 w-3" /> Hors stock</Badge>;
    }
    if (qteNum <= qteMinNum) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {qteNum} en stock</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1"><Package className="h-3 w-3" /> {qteNum} en stock</Badge>;
  };

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-gray-50">
      <div className="flex-1 p-4 md:p-6 flex flex-col">
        <div className="flex flex-wrap items-center gap-4 mb-4 pt-10 md:pt-0">
          <h1 className="font-headline text-3xl font-semibold">Point de Vente</h1>
           <div className="flex-1 flex gap-4 min-w-[300px]">
             <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8"/>
             </div>
             <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                    {displayCategories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                </SelectContent>
             </Select>
           </div>
        </div>

        <Card className="mb-4">
            <CardHeader className='pb-2'>
                <CardTitle className='text-lg font-semibold flex items-center gap-2'><ScanLine/>Vente par Scan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-start gap-2">
                    <Input
                        ref={barcodeInputRef}
                        id="barcode-scan"
                        placeholder="Scannez un code-barres et appuyez sur Entrée..."
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        disabled={isScanning}
                    />
                    <Button onClick={handleScan} disabled={!barcode || isScanning}>
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin"/> : <PackagePlus className="h-4 w-4"/>}
                        <span className="sr-only">Ajouter</span>
                    </Button>
                </div>
                 {scanError && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4"/>
                        <AlertTitle>{scanError}</AlertTitle>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="h-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                  {filteredProducts.map(produit => {
                    const stock = produit.quantiteTotaleGlobale ?? 0;
                    const isOutOfStock = stock <= 0;
                    return (
                      <Card 
                        key={produit.id} 
                        className={cn(
                            "overflow-hidden flex flex-col group",
                            isOutOfStock && "bg-muted/50"
                        )} 
                      >
                        <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
                            <PackagePlus className="w-16 h-16 text-muted-foreground/50 transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute top-2 right-2">
                              <StockBadge qte={stock} qteMin={produit.qteMin || 5} />
                            </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className={cn("font-semibold truncate text-base", isOutOfStock && "text-muted-foreground")}>{produit.nom}</h3>
                                <h3 className={cn("font-semibold truncate text-base", isOutOfStock && "text-muted-foreground")}>{produit.ref}</h3>
                            </div>
                            <p className={cn("text-base font-bold mt-2", isOutOfStock ? "text-muted-foreground" : "text-primary")}>
                                {formatCurrency(produit.prix || 0)}
                            </p>
                        </div>
                         <div className="flex border-t">
                            <Button variant="ghost" className="rounded-none rounded-bl-md flex-1" onClick={() => handleAddToCart(produit, 'UNITE')} disabled={isOutOfStock}>Unité</Button>
                            <div className="border-l"/>
                            <Button variant="ghost" className="rounded-none rounded-br-md flex-1" onClick={() => handleAddToCart(produit, 'CARTON')} disabled={isOutOfStock || !produit.prixCarton}>Carton</Button>
                        </div>
                      </Card>
                    )
                  })}
                  {filteredProducts.length === 0 && (<div className="col-span-full text-center text-muted-foreground py-10"><p>Aucun produit trouvé.</p></div>)}
              </div>
          </ScrollArea>
        </div>
      </div>

      <div className="w-[380px] border-l bg-card flex flex-col h-full">
        <CardHeader className="flex-row items-center justify-between shrink-0">
          <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart className="w-6 h-6" />Panier</CardTitle>
          <CardDescription>{cart.length} article(s)</CardDescription>
        </CardHeader>
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
                <CardContent>
                    {cart.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-24 text-center">Qté</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium py-2">
                                            <p className="truncate">{item.produit.nom}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                {item.type === 'CARTON' ? <CartonIcon className="h-3 w-3"/> : <Package className="h-3 w-3"/>}
                                                {formatCurrency(item.prix_unitaire)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produit.id, item.type, item.quantite - 1)}><Minus className="h-3 w-3"/></Button>
                                                <Input readOnly value={item.quantite} className="h-6 w-8 text-center p-0 border-0 bg-transparent focus-visible:ring-0" />
                                                <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.produit.id, item.type, item.quantite + 1)}><Plus className="h-3 w-3"/></Button>
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
        </div>
        {cart.length > 0 && (
            <div className="p-4 border-t shrink-0">
                <div className="flex justify-between items-center font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                </div>
                <Button size="lg" className="w-full" onClick={() => setIsCheckoutOpen(true)} disabled={isSaving}><DollarSign className="mr-2" /> Finaliser la Vente</Button>
            </div>
        )}
      </div>
       <ScanSelectionDialog 
        isOpen={isSelectionModalOpen}
        onOpenChange={(open) => {
            if (!open) {
                setScannedProductForSelection(null);
                barcodeInputRef.current?.focus();
            }
            setIsSelectionModalOpen(open);
        }}
        produit={scannedProductForSelection}
        onSelect={handleSelectionFromModal}
      />
      <CheckoutDialog 
        isOpen={isCheckoutOpen} 
        onOpenChange={setIsCheckoutOpen} 
        total={total} 
        onCompleteSale={handleCompleteSale} 
        isSaving={isSaving} 
        clients={clients}
        defaultClientId={defaultClient?.id}
      />
    </div>
  );
}
