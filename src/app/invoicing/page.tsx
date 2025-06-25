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
import { PlusCircle, Trash2, Printer, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function NewInvoiceDialog() {
  const { products, addInvoice, processSale } = useApp();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [affectStock, setAffectStock] = useState(false);

  const availableProducts = useMemo(() => {
    return products.filter(p => !items.some(item => item.product.id === p.id));
  }, [products, items]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({ title: "No Product Selected", description: "Please select a product to add.", variant: "destructive" });
      return;
    }
    const productToAdd = products.find(p => p.id === selectedProduct);
    if (productToAdd) {
      if (productToAdd.quantity < 1) {
        toast({ title: "Out of Stock", description: "This product is out of stock.", variant: "destructive" });
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
      toast({ title: "Stock limit exceeded", description: `Only ${productInStock.quantity} units available.`, variant: "destructive" });
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

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCreateInvoice = () => {
    if (!customerName.trim()) {
        toast({ title: "Customer Name Required", description: "Please enter a name for the customer.", variant: "destructive" });
        return;
    }
    if (items.length === 0) {
        toast({ title: "No Items", description: "Please add at least one product to the invoice.", variant: "destructive" });
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
    
    if (affectStock) {
        processSale(items);
        toast({ title: "Invoice Created & Stock Updated", description: "The new invoice has been saved and stock levels adjusted." });
    } else {
        toast({ title: "Invoice Created", description: "The new invoice has been saved." });
    }
    
    setCustomerName('');
    setItems([]);
    setSelectedProduct(undefined);
    setIsOpen(false);
    setAffectStock(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">New Invoice</DialogTitle>
          <DialogDescription>Create a new invoice for a customer. You can choose to update stock levels for this transaction.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="max-w-sm" />
          </div>
          <div className="space-y-2">
            <Label>Add Products</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {availableProducts.length === 0 && <p className="p-4 text-sm text-muted-foreground">No more products to add.</p>}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="border rounded-lg">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Price</TableHead>
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
                      <TableCell className="text-right">${item.product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleRemoveItem(item.product.id)} variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No products added yet.</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                    <TableCell className="text-right font-semibold">${subtotal.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Tax (10%)</TableCell>
                    <TableCell className="text-right font-semibold">${tax.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="text-lg font-bold">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right">${total.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
            </Table>
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
            <div>
                 {/* This feature is not implemented yet */}
            </div>
            <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleCreateInvoice}>Create Invoice</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailsDialog({ invoice }: { invoice: Invoice }) {
    const handlePrint = () => {
        const printContent = document.getElementById(`invoice-print-${invoice.id}`);
        if(printContent){
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`<html><head><title>Print Invoice</title>`);
            printWindow?.document.write('<link rel="stylesheet" href="/_next/static/css/app/layout.css" type="text/css" />'); // A FAIRE : Trouver un moyen plus fiable
            printWindow?.document.write(`<style>
                @media print { 
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none; }
                }
                body { font-family: Arial, sans-serif; }
                .print-container { max-width: 800px; margin: auto; padding: 2rem; }
                .header { text-align: center; margin-bottom: 2rem; }
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
                        <DialogTitle className="font-headline text-2xl">Invoice #{invoice.id}</DialogTitle>
                        <DialogDescription>
                            Date: {format(new Date(invoice.createdAt), 'PPP')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <p><span className="font-semibold">Customer:</span> {invoice.customerName}</p>
                        <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-[120px]">Quantity</TableHead>
                                <TableHead className="text-right w-[120px]">Price</TableHead>
                                <TableHead className="text-right w-[120px]">Total</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {invoice.items.map(item => (
                                <TableRow key={item.product.id}>
                                    <TableCell className="font-medium">{item.product.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">${item.product.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                                <TableCell className="text-right font-semibold">${invoice.subtotal.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-semibold">Tax (10%)</TableCell>
                                <TableCell className="text-right font-semibold">${invoice.tax.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow className="text-lg font-bold">
                                <TableCell colSpan={3} className="text-right">Total</TableCell>
                                <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                            </TableRow>
                            </TableFooter>
                        </Table>
                        </div>
                        <div className="text-center pt-10">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground"/>
                            <p className="font-headline mt-2 text-xl">Thank you for your business!</p>
                            <p className="text-sm text-muted-foreground">StockHero Inc.</p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="no-print">
                    <Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Print</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function InvoicingPage() {
  const { invoices } = useApp();
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Invoicing</h1>
        <div className="ml-auto">
          <NewInvoiceDialog />
        </div>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Invoice History</CardTitle>
            <CardDescription>A list of all invoices from POS and manual creation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {invoices.length > 0 ? [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(invoice => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell className="font-medium">{invoice.customerName}</TableCell>
                        <TableCell>{format(new Date(invoice.createdAt), 'PP')}</TableCell>
                        <TableCell>
                            <Badge variant={invoice.type === 'pos' ? 'secondary' : 'default'}>{invoice.type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${invoice.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                           <InvoiceDetailsDialog invoice={invoice} />
                        </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No invoices found.
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
