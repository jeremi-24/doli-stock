
"use client";

import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Facture, BonLivraison, ShopInfo } from '@/lib/types';
import { useApp } from '@/context/app-provider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, X, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTemplate } from './invoice-template';
import { DeliverySlipTemplate } from './delivery-slip-template';

export function DocumentPreviewDialog({
  isOpen,
  onOpenChange,
  facture,
  bonLivraison,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facture: Facture | null;
  bonLivraison: BonLivraison | null;
}) {
  const { shopInfo } = useApp();
  const { toast } = useToast();
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrintInvoice = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Facture-${facture?.idFacture}`,
    onPrintError: () => toast({ variant: 'destructive', title: `Erreur d'impression`}),
  });
  
  const handlePrintSlip = useReactToPrint({
    content: () => slipRef.current,
    documentTitle: `BL-${bonLivraison?.id}`,
    onPrintError: () => toast({ variant: 'destructive', title: `Erreur d'impression`}),
  });

  if (!facture || !bonLivraison) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Commande Validée</DialogTitle>
          <DialogDescription>
            La facture et le bon de livraison ont été générés. Vous pouvez les imprimer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-6 py-4 min-h-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="font-semibold">Aperçu Facture</h3>
              <Button size="sm" variant="outline" onClick={handlePrintInvoice}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
            <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
              <div className="p-4">
                <InvoiceTemplate ref={invoiceRef} facture={facture} shopInfo={shopInfo} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="font-semibold">Aperçu Bon de Livraison</h3>
              <Button size="sm" variant="outline" onClick={handlePrintSlip}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
            <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
              <div className="p-4">
                <DeliverySlipTemplate ref={slipRef} bonLivraison={bonLivraison} facture={facture} shopInfo={shopInfo} />
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
