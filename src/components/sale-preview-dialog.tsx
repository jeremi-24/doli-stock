"use client";

import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Vente, ShopInfo } from '@/lib/types';
import { useApp } from '@/context/app-provider';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { SaleInvoiceTemplate } from './sale-invoice-template';

export function SalePreviewDialog({
  isOpen,
  onOpenChange,
  vente,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vente: Vente | null;
}) {
  const { shopInfo } = useApp();
  const { toast } = useToast();
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Recu-${vente?.ref}`,
    onPrintError: () => toast({ variant: 'destructive', title: `Erreur d'impression` }),
  });

  if (!vente) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Aperçu du Reçu</DialogTitle>
          <DialogDescription>
            Reçu pour la vente N°{vente.ref}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 min-h-0">
          <ScrollArea className="h-full bg-muted/50 rounded-md border">
            <div className="p-4 flex justify-center">
              <SaleInvoiceTemplate ref={invoiceRef} vente={vente} shopInfo={shopInfo} />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" /> Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
