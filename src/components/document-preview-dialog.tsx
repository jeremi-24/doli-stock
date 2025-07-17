
"use client";

import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Facture, BonLivraison, ShopInfo } from '@/lib/types';
import { useApp } from '@/context/app-provider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

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

const DeliverySlipPreview = React.forwardRef<HTMLDivElement, { bonLivraison: BonLivraison, shopInfo: ShopInfo }>(({ bonLivraison, shopInfo }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-8 font-sans text-sm w-full">
            <header className="flex justify-between items-start pb-4 border-b">
                <div className="w-2/3">
                    {shopInfo.logoUrl ? <img src={shopInfo.logoUrl} alt="Logo" className="h-16 w-auto" /> : <h1 className="text-2xl font-bold">{shopInfo.nom}</h1>}
                     <p className="mt-2 text-xs text-gray-600">{shopInfo.adresse}, {shopInfo.ville}</p>
                    <p className="text-xs text-gray-600">{shopInfo.telephone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase">Bon de Livraison</h2>
                    <p className="text-xs">N° : BL-{String(bonLivraison.id).padStart(5, '0')}</p>
                    <p className="text-xs">Date : {format(new Date(bonLivraison.dateLivraison), 'd MMM yyyy', { locale: fr })}</p>
                </div>
            </header>
            <section className="mt-6">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Client :</h3>
                <p className="font-bold">{bonLivraison.client.nom}</p>
            </section>
            <section className="mt-6">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50"><tr className="text-gray-600">
                        <th className="p-2 font-semibold">Produit</th>
                        <th className="p-2 font-semibold text-center w-24">Quantité Livrée</th>
                    </tr></thead>
                    <tbody>{bonLivraison.lignes.map((ligne) => (<tr key={ligne.id} className="border-b border-gray-100">
                        <td className="p-2">{ligne.produitNom}</td>
                        <td className="p-2 text-center">{ligne.qteLivre}</td>
                    </tr>))}</tbody>
                </table>
            </section>
             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Signature du client : _________________________</p>
            </footer>
        </div>
    );
});
DeliverySlipPreview.displayName = 'DeliverySlipPreview';


export function DocumentPreviewDialog({ isOpen, onOpenChange, facture, bonLivraison }: { isOpen: boolean, onOpenChange: (open: boolean) => void, facture: Facture, bonLivraison: BonLivraison }) {
    const { shopInfo } = useApp();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const deliverySlipRef = useRef<HTMLDivElement>(null);
    
    const handlePrintInvoice = useReactToPrint({
        content: () => invoiceRef.current,
    });
    const handlePrintDeliverySlip = useReactToPrint({
        content: () => deliverySlipRef.current,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline">Commande Validée</DialogTitle>
                    <DialogDescription>
                        La facture et le bon de livraison ont été générés. Vous pouvez les imprimer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden py-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="font-semibold">Aperçu Facture</h3>
                            <Button size="sm" variant="outline" onClick={handlePrintInvoice}><Printer className="mr-2 h-4 w-4" />Imprimer</Button>
                        </div>
                        <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
                            <InvoicePreview ref={invoiceRef} facture={facture} shopInfo={shopInfo} />
                        </ScrollArea>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex justify-between items-center px-4">
                            <h3 className="font-semibold">Aperçu Bon de Livraison</h3>
                            <Button size="sm" variant="outline" onClick={handlePrintDeliverySlip}><Printer className="mr-2 h-4 w-4" />Imprimer</Button>
                        </div>
                        <ScrollArea className="flex-1 bg-muted/50 rounded-md border">
                           <DeliverySlipPreview ref={deliverySlipRef} bonLivraison={bonLivraison} shopInfo={shopInfo} />
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
