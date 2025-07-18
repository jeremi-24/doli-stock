
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
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const InvoicePreview = React.forwardRef<HTMLDivElement, { facture: Facture, shopInfo: ShopInfo }>(({ facture, shopInfo }, ref) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    return (
        <div ref={ref} className="bg-white text-black p-8 font-sans text-sm w-full">
            <header className="flex justify-between items-start pb-4 border-b">
                <div className="w-2/3">
                    {shopInfo.logoUrl ? <img src={shopInfo.logoUrl} alt="Logo" className="h-16 w-auto" /> : <h1 className="text-2xl font-bold">{shopInfo.nom}</h1>}
                    <p className="mt-2 text-xs text-gray-600">{shopInfo.adresse}, {shopInfo.ville}</p>
                    <p className="text-xs text-gray-600">{shopInfo.telephone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase">Facture</h2>
                    <p className="text-xs">N° : FACT-{String(facture.idFacture).padStart(5, '0')}</p>
                    <p className="text-xs">Date : {format(new Date(facture.dateFacture), 'd MMM yyyy', { locale: fr })}</p>
                </div>
            </header>
            <section className="mt-6">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Facturé à :</h3>
                <p className="font-bold">{facture.clientNom}</p>
            </section>
            <section className="mt-6">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50"><tr className="text-gray-600">
                        <th className="p-2 font-semibold">Produit</th>
                        <th className="p-2 font-semibold text-center w-16">Qté</th>
                        <th className="p-2 font-semibold text-right w-24">P.U.</th>
                        <th className="p-2 font-semibold text-right w-24">Total</th>
                    </tr></thead>
                    <tbody>{facture.lignes.map((ligne) => (<tr key={ligne.id} className="border-b border-gray-100">
                        <td className="p-2">{ligne.produitNom}</td>
                        <td className="p-2 text-center">{ligne.qteVoulu}</td>
                        <td className="p-2 text-right">{formatCurrency(ligne.produitPrix)}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(ligne.totalLigne)}</td>
                    </tr>))}</tbody>
                </table>
            </section>
            <section className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                        <span className="font-bold">TOTAL</span>
                        <span className="font-bold">{formatCurrency(facture.montantTotal)}</span>
                    </div>
                </div>
            </section>
             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Merci de votre confiance.</p>
            </footer>
        </div>
    );
});
InvoicePreview.displayName = 'InvoicePreview';

const DeliverySlipPreview = React.forwardRef<HTMLDivElement, { bonLivraison: BonLivraison, facture: Facture, shopInfo: ShopInfo }>(({ bonLivraison, facture, shopInfo }, ref) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    const total = bonLivraison.lignesLivraison.reduce((sum, item) => sum + item.totalLigne, 0);

    return (
        <div ref={ref} className="bg-white text-black p-6 font-mono text-[10px] w-full border border-gray-300">
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold">{shopInfo.nom || 'MEGA TRAM'}</h1>
                <p>MECANIQUE GENERALE TRANSPORT ET MANUTENTION</p>
                <p>BP 228 KEGUE TEL: {shopInfo.telephone || '90 15 56 57 / 22 61 89 96 / 99 08 85 80'}</p>
                <p>{shopInfo.adresse || 'Kégué Kélégougan Lomé - TOGO'}</p>
            </div>

            <div className="text-center mb-2">
                <h2 className="text-lg font-bold border-b-2 border-black inline-block px-4">BON DE LIVRAISON</h2>
            </div>
            <div className="flex justify-between mb-2">
                <span>Lomé, le: {format(new Date(bonLivraison.dateLivraison), 'dd/MM/yyyy', { locale: fr })}</span>
                <span className="font-bold">N° {String(bonLivraison.id).padStart(5, '0')}</span>
            </div>
            <div className="mb-2">
                <span>Nom du client: {facture.clientNom}</span>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-16">Qté</th>
                        <th className="border-r border-black p-1">DESIGNATION</th>
                        <th className="border-r border-black p-1 w-24">P. Unit.</th>
                        <th className="p-1 w-24">P. Total</th>
                    </tr>
                </thead>
                <tbody>
                    {bonLivraison.lignesLivraison.map(ligne => (
                        <tr key={ligne.id} className="border-b border-black">
                            <td className="border-r border-black p-1 text-center">{ligne.qteLivre}</td>
                            <td className="border-r border-black p-1">{ligne.produitNom}</td>
                            <td className="border-r border-black p-1 text-right">{formatCurrency(ligne.produitPrix)}</td>
                            <td className="p-1 text-right">{formatCurrency(ligne.totalLigne)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: 15 - bonLivraison.lignesLivraison.length }).map((_, i) => (
                         <tr key={`empty-${i}`} className="border-b border-black h-5">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                        </tr>
                    ))}
                    <tr className="border-b-2 border-black font-bold">
                        <td colSpan={2} className="p-1 text-right border-r border-black">TOTAL</td>
                        <td colSpan={2} className="p-1 text-right">{formatCurrency(total)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-2 text-[9px]">
                <p>Arrêté le présent BON DE LIVRAISON à la somme de: ....................................................................</p>
            </div>
            <div className="flex justify-between mt-8">
                <div className="text-center">
                    <p>Signature du Livreur</p>
                    <p className="mt-8">...................................</p>
                </div>
                <div className="text-center">
                    <p>Signature du Receveur</p>
                    <p className="mt-8">...................................</p>
                </div>
            </div>
        </div>
    );
});
DeliverySlipPreview.displayName = 'DeliverySlipPreview';

export function DocumentPreviewDialog({
  isOpen,
  onOpenChange,
  facture,
  bonLivraison,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facture: Facture;
  bonLivraison: BonLivraison;
}) {
  const { shopInfo } = useApp();
  const { toast } = useToast();
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);
  const [isPrintingSlip, setIsPrintingSlip] = useState(false);

  const handlePrint = async (type: 'invoice' | 'delivery') => {
      if (type === 'invoice') setIsPrintingInvoice(true);
      if (type === 'delivery') setIsPrintingSlip(true);

      try {
          const id = type === 'invoice' ? facture.idFacture : bonLivraison.id;
          const pdfBlob = type === 'invoice' 
              ? await api.genererFacturePdf(id) 
              : await api.genererBonLivraisonPdf(id);
          
          const url = window.URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          window.URL.revokeObjectURL(url);

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
          toast({ variant: 'destructive', title: `Erreur d'impression`, description: errorMessage });
      } finally {
          if (type === 'invoice') setIsPrintingInvoice(false);
          if (type === 'delivery') setIsPrintingSlip(false);
      }
  };

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
              <Button size="sm" variant="outline" onClick={() => handlePrint('invoice')} disabled={isPrintingInvoice}>
                {isPrintingInvoice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {isPrintingInvoice ? 'Génération...' : 'Imprimer'}
              </Button>
            </div>
            <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
              <div className="p-4">
                <InvoicePreview facture={facture} shopInfo={shopInfo} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="font-semibold">Aperçu Bon de Livraison</h3>
              <Button size="sm" variant="outline" onClick={() => handlePrint('delivery')} disabled={isPrintingSlip}>
                {isPrintingSlip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {isPrintingSlip ? 'Génération...' : 'Imprimer'}
              </Button>
            </div>
            <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
              <div className="p-4">
                <DeliverySlipPreview bonLivraison={bonLivraison} facture={facture} shopInfo={shopInfo} />
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
