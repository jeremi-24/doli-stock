
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
import type { InvoiceItem, Product, Invoice } from '@/lib/types';
import { PlusCircle, Trash2, Printer, FileText, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function NewInvoiceDialog() {
  const { products, addInvoice, processSale } = useApp();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  const availableProducts = useMemo(() => {
    return products.filter(p => !items.some(item => item.product.id === p.id));
  }, [products, items]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({ title: "Aucun produit sélectionné", description: "Veuillez sélectionner un produit à ajouter.", variant: "destructive" });
      return;
    }
    const productToAdd = products.find(p => p.id === selectedProduct);
    if (productToAdd) {
      if (productToAdd.quantity < 1) {
        toast({ title: "Rupture de stock", description: "Ce produit est en rupture de stock.", variant: "destructive" });
        return;
      }
      setItems([...items, { product: productToAdd, quantity: 1 }]);
      setSelectedProduct(undefined);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const productInStock = products.find(p => p.id === productId);
    if (productInStock && quantity > productInStock.quantity) {
      toast({ title: "Limite de stock dépassée", description: `Seulement ${productInStock.quantity} unités disponibles.`, variant: "destructive" });
      return;
    }
    if (quantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    setItems(items.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  const tax = subtotal * 0.18; // TVA à 18%
  const total = subtotal + tax;

  const handleCreateInvoice = () => {
    if (!customerName.trim()) {
        toast({ title: "Nom du client requis", description: "Veuillez entrer un nom pour le client.", variant: "destructive" });
        return;
    }
    if (items.length === 0) {
        toast({ title: "Aucun article", description: "Veuillez ajouter au moins un produit à la facture.", variant: "destructive" });
        return;
    }

    addInvoice({
        customerName,
        items,
        subtotal,
        tax,
        total,
        type: 'manual',
    });
    
    processSale(items);
    toast({ title: "Facture créée et stock mis à jour", description: "La nouvelle facture a été enregistrée et les niveaux de stock ajustés." });
    
    setCustomerName('');
    setItems([]);
    setSelectedProduct(undefined);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Créer une Facture Manuelle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Nouvelle Facture Manuelle</DialogTitle>
          <DialogDescription>Créez une facture et mettez à jour les niveaux de stock pour cette transaction.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nom du Client</Label>
            <Input id="customerName" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="max-w-sm" />
          </div>
          <div className="space-y-2">
            <Label>Ajouter des Produits</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {availableProducts.length === 0 && <p className="p-4 text-sm text-muted-foreground">Plus de produits à ajouter.</p>}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
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
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? items.map(item => (
                    <TableRow key={item.product.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value))}
                          min="1"
                          max={products.find(p => p.id === item.product.id)?.quantity}
                          className="h-8 w-20"
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.product.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.product.price * item.quantity)}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleRemoveItem(item.product.id)} variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit ajouté.</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Sous-total</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(subtotal)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">TVA (18%)</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(tax)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="text-lg font-bold">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
            </Table>
          </div>
        </div>
        <DialogFooter className="justify-end sm:justify-end">
            <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                <Button onClick={handleCreateInvoice}>Créer la Facture</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailsDialog({ invoice }: { invoice: Invoice }) {
    const { shopInfo } = useApp();
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    const handlePrint = () => {
        const printContent = document.getElementById(`invoice-print-${invoice.id}`);
        if(printContent){
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`<html><head><title>Imprimer la Facture</title>`);
            printWindow?.document.write('<link rel="stylesheet" href="/_next/static/css/app/layout.css" type="text/css" media="all" />'); // A FAIRE : Trouver un moyen plus fiable
            printWindow?.document.write(`<style>
                @media print { 
                    body { -webkit-print-color-adjust: exact; font-family: sans-serif; }
                    .no-print { display: none; }
                }
                body { font-family: sans-serif; }
                .print-container { max-width: 800px; margin: auto; padding: 2rem; }
                .header { text-align: center; margin-bottom: 2rem; }
                .shop-info { text-align: center; margin-bottom: 2rem; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .font-semibold { font-weight: 600; }
                .font-bold { font-weight: 700; }
                .text-lg { font-size: 1.125rem; }
                .mt-2 { margin-top: 0.5rem; }
                .text-muted-foreground { color: #64748b; }
            </style>`);
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            setTimeout(() => {
                printWindow?.print();
            }, 500);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <div id={`invoice-print-${invoice.id}`} className="print-container">
                    <DialogHeader className="header">
                        <DialogTitle className="font-headline text-2xl">FACTURE #{invoice.id}</DialogTitle>
                        <DialogDescription>
                            Date: {format(new Date(invoice.createdAt), 'd MMMM yyyy', { locale: fr })}
                        </DialogDescription>
                    </DialogHeader>
                     <div className="shop-info">
                        <h3 className="font-bold text-lg">{shopInfo.name}</h3>
                        <p className="text-sm text-muted-foreground">{shopInfo.address}</p>
                        <p className="text-sm text-muted-foreground">Tél: {shopInfo.phone} | Email: {shopInfo.email}</p>
                    </div>
                    <div className="py-6 space-y-6">
                        <p><span className="font-semibold">Client:</span> {invoice.customerName}</p>
                        <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="w-[120px]">Quantité</TableHead>
                                <TableHead className="text-right w-[120px]">Prix</TableHead>
                                <TableHead className="text-right w-[120px]">Total</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {invoice.items.map(item => (
                                <TableRow key={item.product.id}>
                                    <TableCell className="font-medium">{item.product.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.product.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.product.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-semibold">Sous-total</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(invoice.subtotal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-semibold">TVA (18%)</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(invoice.tax)}</TableCell>
                            </TableRow>
                            <TableRow className="text-lg font-bold">
                                <TableCell colSpan={3} className="text-right">Total</TableCell>
                                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                            </TableRow>
                            </TableFooter>
                        </Table>
                        </div>
                        <div className="text-center pt-10">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground"/>
                            <p className="font-headline mt-2 text-xl">Merci pour votre confiance !</p>
                            <p className="text-sm text-muted-foreground">{shopInfo.name}</p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="no-print">
                    <Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Imprimer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function InvoicingPage() {
  const { invoices } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
      return [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter(invoice => 
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
  }, [invoices, searchTerm]);
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Facturation</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
              type="search"
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
           </div>
          <NewInvoiceDialog />
        </div>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Historique des Factures</CardTitle>
            <CardDescription>Liste de toutes les factures (PDV et manuelles).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell className="font-medium">{invoice.customerName}</TableCell>
                        <TableCell>{format(new Date(invoice.createdAt), 'd MMM yyyy', { locale: fr })}</TableCell>
                        <TableCell>
                            <Badge variant={invoice.type === 'pos' ? 'secondary' : 'default'}>{invoice.type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell className="text-right">
                           <InvoiceDetailsDialog invoice={invoice} />
                        </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            {searchTerm ? "Aucune facture ne correspond à votre recherche." : "Aucune facture trouvée."}
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
