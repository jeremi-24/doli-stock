
"use client";

import type { BonLivraison, Facture, ShopInfo } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import Image from 'next/image';

export const DeliverySlipTemplate = React.forwardRef<HTMLDivElement, { bonLivraison: BonLivraison, facture: Facture, shopInfo: ShopInfo }>(({ bonLivraison, facture, shopInfo }, ref) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    return (
        <div ref={ref} className="bg-white text-black p-6 font-mono text-[10px] w-full border border-gray-300">
            <div className="text-center mb-4">
                <div>
                <Image 
    src={shopInfo.logoUrl || '/default-logo.png'} 
    alt="Logo" 
    width={100} 
    height={100} 
    className="mx-auto mb-2"
/>
                </div>
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
                            <td className="border-r border-black p-1 text-center">{ligne.qteLivreeTotaleUnites}</td>
                            <td className="border-r border-black p-1">{ligne.produitNom}</td>
                            <td className="border-r border-black p-1 text-right">{formatCurrency(ligne.produitPrix)}</td>
                            <td className="p-1 text-right">{formatCurrency(ligne.totalLivraison)}</td>
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
                        <td colSpan={2} className="p-1 text-right">{formatCurrency(bonLivraison.totalLivraison)}</td>
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
DeliverySlipTemplate.displayName = 'DeliverySlipTemplate';
