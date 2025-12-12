"use client";

import type { Vente, ShopInfo } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import Image from 'next/image';

export const SaleInvoiceTemplate = React.forwardRef<HTMLDivElement, { vente: Vente, shopInfo: ShopInfo }>(({ vente, shopInfo }, ref) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  return (
    <div ref={ref} className="bg-white text-black p-4 font-mono text-xs w-[80mm] mx-auto">
      <div className="text-center mb-4">
        {shopInfo.logoUrl ? (
          <Image src={shopInfo.logoUrl} alt="Logo" width={80} height={80} className="mx-auto mb-2" />
        ) : (
          <h2 className="text-lg font-bold">{shopInfo.nom}</h2>
        )}
        <p>{shopInfo.adresse}, {shopInfo.ville}</p>
        <p>Tél: {shopInfo.telephone}</p>
      </div>

      <div className="mb-2">
        <p>Reçu N°: {vente.ref}</p>
        <p>Date: {format(new Date(vente.date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
        <p>Caissier: {vente.caissier}</p>
        <p>Client: {vente.client?.nom || 'N/A'}</p>
      </div>
      
      <div className="border-t border-b border-dashed my-2 py-1">
        <div className="flex justify-between font-bold">
            <span>PRODUIT</span>
            <span>TOTAL</span>
        </div>
      </div>

      <div className="space-y-1">
        {vente.lignes.map(ligne => (
          <div key={ligne.id}>
            <p>{ligne.produitNom}</p>
            <div className="flex justify-between pl-2">
                <span>{ligne.qteVendueTotaleUnites} x {formatCurrency(ligne.produitPrix)}</span>
                <span>{formatCurrency(ligne.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed mt-2 pt-2">
        <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span>{formatCurrency(vente.total)}</span>
        </div>
         <div className="flex justify-between">
            <span>Montant Payé</span>
            <span>{formatCurrency(vente.montantPaye)}</span>
        </div>
         {vente.soldeRestant > 0 && (
            <div className="flex justify-between font-bold">
                <span>Reste à payer</span>
                <span>{formatCurrency(vente.soldeRestant)}</span>
            </div>
        )}
      </div>

      <div className="text-center mt-4 text-[9px]">
        <p>Merci de votre visite !</p>
      </div>
    </div>
  );
});

SaleInvoiceTemplate.displayName = 'SaleInvoiceTemplate';
