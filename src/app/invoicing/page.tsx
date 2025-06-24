"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useApp } from '@/context/app-provider';
import type { InvoiceItem } from '@/lib/types';
import { PlusCircle, Trash2, Printer, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvoicingPage() {
  const { products } = useApp();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);

  const availableProducts = useMemo(() => {
    return products.filter(p => !items.some(item => item.product.id === p.id));
  }, [products, items]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product to add.",
        variant: "destructive",
      });
      return;
    }
    const productToAdd = products.find(p => p.id === selectedProduct);
    if (productToAdd) {
      if (productToAdd.quantity < 1) {
        toast({
          title: "Out of Stock",
          description: "This product is out of stock.",
          variant: "destructive",
        });
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
      toast({
        title: "Stock limit exceeded",
        description: `Only ${productInStock.quantity} units available.`,
        variant: "destructive",
      });
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

  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Invoicing</h1>
        <Button onClick={handlePrint} variant="outline" size="sm" className="ml-auto flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <div className="grid gap-6 print:block">
        <Card className="print:shadow-none print:border-none">
          <CardHeader>
            <CardTitle className="font-headline">New Invoice</CardTitle>
            <CardDescription>Create a new invoice for a customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="max-w-sm print:border-0 print:pl-0 print:text-lg print:font-semibold"
              />
            </div>

            <div className="space-y-2 print:hidden">
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
                <Button onClick={handleAddItem} variant="outline" size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
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
                    <TableHead className="w-[50px] print:hidden"></TableHead>
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
                          className="h-8 w-20 print:border-0"
                        />
                      </TableCell>
                      <TableCell className="text-right">${item.product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell className="print:hidden">
                        <Button onClick={() => handleRemoveItem(item.product.id)} variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No products added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                    <TableCell className="text-right font-semibold">${subtotal.toFixed(2)}</TableCell>
                    <TableCell className="print:hidden"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Tax (10%)</TableCell>
                    <TableCell className="text-right font-semibold">${tax.toFixed(2)}</TableCell>
                    <TableCell className="print:hidden"></TableCell>
                  </TableRow>
                  <TableRow className="text-lg font-bold">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right">${total.toFixed(2)}</TableCell>
                    <TableCell className="print:hidden"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="text-center print:block hidden pt-10">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground"/>
                <p className="font-headline mt-2 text-xl">Thank you for your business!</p>
                <p className="text-sm text-muted-foreground">StockHero Inc.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        @media print {
          body > *:not(.grid) {
            display: none;
          }
          .grid {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
