
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-provider';
import type { Product, InvoiceItem } from '@/lib/types';
import { Plus, Minus, Search, Trash2, ShoppingCart, DollarSign, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function POSPage() {
  const { products, processSale } = useApp();
  const { toast } = useToast();
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Tout");

  const categories = useMemo(() => ['Tout', ...new Set(products.map(p => p.category))], [products]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.quantity > 0)
      .filter(p => activeTab === 'Tout' || p.category === activeTab)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, activeTab, searchTerm]);


  const handleAddToCart = (product: Product) => {
    const productInStock = products.find(p => p.id === product.id);
    if (!productInStock || productInStock.quantity <= 0) {
       toast({ title: "Rupture de stock", description: `${product.name} est actuellement en rupture de stock.`, variant: 'destructive' });
       return;
    }
    
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= productInStock.quantity) {
        toast({ title: "Limite de stock atteinte", description: `Seulement ${productInStock.quantity} unités de ${product.name} disponibles.`, variant: 'destructive' });
        return;
      }
      handleQuantityChange(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { product: productInStock, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.quantity) {
      toast({ title: "Limite de stock atteinte", description: `Seulement ${product.quantity} unités disponibles.`, variant: 'destructive' });
      quantity = product.quantity;
    }

    if (quantity < 1) {
        handleRemoveFromCart(productId);
        return;
    }

    setCart(cart.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const tax = subtotal * 0.18; // TVA à 18%
  const total = subtotal + tax;

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({ title: "Panier vide", description: "Ajoutez des produits au panier avant de finaliser la vente.", variant: 'destructive' });
      return;
    }

    processSale(cart);
    toast({ title: "Vente finalisée !", description: `Total : ${formatCurrency(total)}. Le stock a été mis à jour.`});
    setCart([]);
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-3.5rem)]">
      <div className="flex-1 p-4 md:p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="font-headline text-3xl font-semibold">Point de Vente</h1>
           <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4 shrink-0">
            {categories.map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pr-4">
                      {filteredProducts
                      .map(product => (
                          <Card key={product.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors flex flex-col" onClick={() => handleAddToCart(product)}>
                              <CardHeader className="p-0">
                                  <div className="aspect-square bg-muted flex items-center justify-center">
                                     <PackagePlus className="w-12 h-12 text-muted-foreground" />
                                  </div>
                              </CardHeader>
                              <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                  <div>
                                      <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                                      <p className="text-xs text-muted-foreground">{product.quantity} en stock</p>
                                  </div>
                                  <p className="text-base text-primary font-bold mt-2">{formatCurrency(product.price)}</p>
                              </CardContent>
                          </Card>
                      ))}
                      {filteredProducts.length === 0 && (
                          <div className="col-span-full text-center text-muted-foreground py-10">
                              <p>Aucun produit trouvé.</p>
                          </div>
                      )}
                  </div>
              </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-[380px] border-l bg-card flex flex-col">
        <CardHeader className="flex-row items-center justify-between shrink-0">
          <CardTitle className="font-headline flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Panier
          </CardTitle>
          <CardDescription>{cart.length} article(s)</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1 min-h-0">
            <CardContent>
                {cart.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="w-24 text-center">Qté</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.map(item => (
                                <TableRow key={item.product.id}>
                                    <TableCell className="font-medium py-2">
                                        <p className="truncate">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)}</p>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                            <Input readOnly value={item.quantity} className="h-6 w-8 text-center p-0 border-0 bg-transparent focus-visible:ring-0" />
                                            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-2">{formatCurrency(item.product.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10 h-full text-muted-foreground">
                        <ShoppingCart className="w-12 h-12" />
                        <p className="mt-4 text-sm">Votre panier est vide.</p>
                        <p className="text-xs">Cliquez sur un produit pour l'ajouter.</p>
                    </div>
                )}
            </CardContent>
        </ScrollArea>
        {cart.length > 0 && (
            <div className="p-4 border-t mt-auto shrink-0">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Sous-total</TableCell>
                            <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>TVA (18%)</TableCell>
                            <TableCell className="text-right">{formatCurrency(tax)}</TableCell>
                        </TableRow>
                         <TableRow className="font-bold text-lg">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Button size="lg" className="w-full mt-4" onClick={handleCompleteSale}>
                    <DollarSign className="mr-2" /> Finaliser la Vente
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
