
"use client";

import type { Commande } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import { useApp } from '@/context/app-provider';
import Image from 'next/image';

export const OrderTemplate = React.forwardRef<HTMLDivElement, { commande: Commande }>(({ commande }, ref) => {
    const { shopInfo } = useApp();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    return (
        <div ref={ref} className="bg-white text-black p-6 font-mono text-[10px] w-full border border-gray-300">
            <div className="text-center mb-4">
                <Image 
                    src="/logosta.png"
                    alt="Logo" 
                    width={100} 
                    height={100} 
                    className="mx-auto mb-2"
                />
                <div className="text-[9px] uppercase font-medium text-gray-700 space-y-0.5">
            <p>Concessionnaire automobile, Commerce général, Import-Export,</p>
            <p>Vente et distribution de véhicules, pièces détachées, pneus et lubrifiants moteur</p>
          </div>
                <p>{shopInfo.adresse || 'Kégué Kélégougan Lomé - TOGO'}</p>
            </div>

            <div className="text-center mb-2">
                <h2 className="text-lg font-bold border-b-2 border-black inline-block px-4">DETAILS DE LA COMMANDE</h2>
            </div>
            <div className="flex justify-between mb-2">
                <span>Lomé, le: {format(new Date(commande.date), 'dd/MM/yyyy', { locale: fr })}</span>
                <span className="font-bold">N° {String(commande.id).padStart(5, '0')}</span>
            </div>
            <div className="mb-2">
                <span>Nom du client: {commande.client?.nom || 'N/A'}</span>
            </div>
            <div className="mb-2">
                <span>Lieu de livraison: {commande.lieuLivraison?.nom || 'N/A'}</span>
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
                    {commande.lignes.map(ligne => (
                        <tr key={ligne.id} className="border-b border-black">
                            <td className="border-r border-black p-1 text-center">{ligne.qteVoulu}</td>
                            <td className="border-r border-black p-1">{ligne.produitNom}</td>
                            <td className="border-r border-black p-1 text-right">{formatCurrency(ligne.produitPrix)}</td>
                            <td className="p-1 text-right">{formatCurrency(ligne.totalLigne)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 15 - commande.lignes.length) }).map((_, i) => (
                         <tr key={`empty-${i}`} className="border-b border-black h-5">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                        </tr>
                    ))}
                    <tr className="border-b-2 border-black font-bold">
                        <td colSpan={2} className="p-1 text-right border-r border-black">TOTAL</td>
                        <td colSpan={2} className="p-1 text-right">{formatCurrency(commande.totalCommande)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-between mt-8">
                <div className="text-center">
                    <p>Demandeur</p>
                    <p className="mt-8">...................................</p>
                </div>
                <div className="text-center">
                    <p>Validation Direction</p>
                    <p className="mt-8">...................................</p>
                </div>
            </div>
        </div>
    );
});
OrderTemplate.displayName = 'OrderTemplate';
