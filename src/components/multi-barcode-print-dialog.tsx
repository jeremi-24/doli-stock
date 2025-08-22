"use client";

import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import type { Produit, BarcodePrintRequest } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Printer, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';


export function MultiBarcodePrintDialog({
  open,
  onOpenChange,
  allProducts
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProducts: Produit[];
}) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BarcodePrintRequest[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  const productsMap = useMemo(() => new Map(allProducts.map(p => [p.id, p])), [allProducts]);

  const handleProductToggle = (productId: number, checked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleAddSelectedProducts = () => {
    const newRequests = Array.from(selectedProducts)
      .filter(id => !requests.some(r => r.produitId === id))
      .map(id => ({ produitId: id, quantite: 1 }));
    
    setRequests(prev => [...prev, ...newRequests]);
    setSelectedProducts(new Set());
    setPopoverOpen(false);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const qte = Math.max(1, newQuantity);
    setRequests(prev => prev.map(r => r.produitId === productId ? { ...r, quantite: qte } : r));
  };
  
  const handleRemoveProduct = (productId: number) => {
    setRequests(prev => prev.filter(r => r.produitId !== productId));
  };
  
  const handlePrint = async () => {
    if(requests.length === 0) {
      toast({ variant: 'destructive', title: 'Aucun produit sélectionné' });
      return;
    }
    setIsPrinting(true);
    try {
      const pdfBlob = await api.printMultipleBarcodes(requests);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquettes-multiples.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      onOpenChange(false);
      setRequests([]);
      toast({ title: "PDF généré", description: `Le fichier d'étiquettes est en cours de téléchargement.` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: "destructive", title: "Erreur d'impression", description: errorMessage });
    } finally {
      setIsPrinting(false);
    }
  };

  const availableProducts = useMemo(() => {
    const selectedIds = new Set(requests.map(r => r.produitId));
    return allProducts.filter(p => !selectedIds.has(p.id));
  }, [allProducts, requests]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Imprimer plusieurs codes-barres</DialogTitle>
          <DialogDescription>
            Ajoutez des produits et spécifiez la quantité d'étiquettes à imprimer pour chacun.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="flex items-center gap-2 mb-4">
               <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Ajouter des produits...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher des produits..." />
                    <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-48">
                        {availableProducts.map(produit => (
                          <CommandItem
                            key={produit.id}
                            value={`${produit.nom} ${produit.ref}`}
                            onSelect={() => {}} // Empêche la fermeture automatique
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              id={`product-${produit.id}`}
                              checked={selectedProducts.has(produit.id)}
                              onCheckedChange={(checked) => handleProductToggle(produit.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()} // Empêche la propagation
                            />
                            <label 
                              htmlFor={`product-${produit.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p>{produit.nom}</p>
                              <p className="text-xs text-muted-foreground">{produit.ref}</p>
                            </label>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                    {selectedProducts.size > 0 && (
                      <div className="border-t p-2">
                        <Button 
                          onClick={handleAddSelectedProducts}
                          className="w-full"
                          size="sm"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Ajouter {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {requests.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-[120px]">Quantité</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map(req => {
                      const produit = productsMap.get(req.produitId);
                      return (
                        <TableRow key={req.produitId}>
                          <TableCell>
                            <p className="font-medium">{produit?.nom}</p>
                            <p className="text-xs text-muted-foreground">{produit?.ref}</p>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={req.quantite}
                              onChange={(e) => handleQuantityChange(req.produitId, parseInt(e.target.value))}
                              className="h-8"
                              min={1}
                              disabled={isPrinting}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(req.produitId)}
                              disabled={isPrinting}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
                <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Aucun produit ajouté.</p>
                </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={isPrinting}>Annuler</Button></DialogClose>
          <Button onClick={handlePrint} disabled={isPrinting || requests.length === 0}>
            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
            {isPrinting ? "Génération..." : `Générer PDF (${requests.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}