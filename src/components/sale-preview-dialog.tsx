
"use client";

import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Vente, Facture } from '@/lib/types';
import { useApp } from '@/context/app-provider';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTemplate } from './invoice-template';

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
    documentTitle: `Facture-Vente-${vente?.ref}`,
    onPrintError: () => toast({ variant: 'destructive', title: `Erreur d'impression` }),
  });

  if (!vente) {
    return null;
  }

  // Adapter l'objet Vente à la structure de Facture attendue par InvoiceTemplate
  const adaptedFacture: Facture = {
    idFacture: vente.id,
    dateFacture: vente.date,
    commandeId: vente.id, // Pas de CommandeId distinct pour une vente directe
    clientNom: vente.client?.nom || 'Client comptant',
    clientAdresse: vente.client?.adresse || '',
    montantTotal: vente.total,
    tvaApplicable: false, // Les ventes POS sont supposées être TTC sans détail de TVA
    lignes: vente.lignes.map(ligne => ({
      id: ligne.id,
      produitNom: ligne.produitNom,
      produitRef: ligne.codeProduit, // Utiliser codeProduit comme ref
      qteVoulu: ligne.qteVendueTotaleUnites,
      produitPrix: ligne.produitPrix,
      totalLigne: ligne.total,
    })),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Aperçu de la Facture</DialogTitle>
          <DialogDescription>
            Facture pour la vente N°{vente.ref}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 min-h-0">
          <ScrollArea className="h-full bg-muted/50 rounded-md border">
            <div className="p-4 flex justify-center">
               <InvoiceTemplate ref={invoiceRef} facture={adaptedFacture} shopInfo={shopInfo} />
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
