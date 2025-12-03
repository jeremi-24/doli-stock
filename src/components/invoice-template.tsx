
"use client";

import type { ShopInfo, Facture } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import { useApp } from '@/context/app-provider';

function numberToWords(num: number) {
    const a = [
        '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'
    ];
    const b = [
        '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
    ];
    const s = [
        '', 'mille', 'million', 'milliard', 'billion'
    ];

    if (num === 0) return 'zéro';
    
    let str = "";
    let i = 0;

    while (num > 0) {
        let h = Math.floor(num % 1000);
        num = Math.floor(num / 1000);

        if (h > 0) {
            let temp = "";
            let c = Math.floor(h / 100);
            let tu = h % 100;

            if (c > 0) {
                temp += (c > 1 ? a[c] + ' ' : '') + 'cent';
                if (tu === 0 && h > 100) temp += 's';
            }

            if (tu > 0) {
                if (c > 0) temp += ' ';
                if (tu < 17) {
                    temp += a[tu];
                } else {
                    let t = Math.floor(tu / 10);
                    let u = tu % 10;
                    if (b[t].endsWith('vingt') && u === 1) { // vingt-et-un
                        temp += b[t] + (u > 0 ? '-et-' + a[u] : '');
                    } else {
                        temp += b[t] + (u > 0 ? '-' + a[u] : '');
                    }
                }
            }
            if (num > 0 && i > 0 && h === 1 && (s[i] === 'mille')) {
               temp = s[i]
            } else {
               temp += (i > 0 ? ' ' + s[i] + (h > 1 && s[i] !== 'mille' ? 's' : '') : '');
            }

            str = temp + (str ? ' ' + str : '');
        }
        i++;
    }

    return str.trim();
}


export const InvoiceTemplate = React.forwardRef<HTMLDivElement, { facture: Facture, shopInfo: ShopInfo }>(({ shopInfo, facture }, ref) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);
  
  const tvaRate = 0.18;
  const montantHorsTaxe = facture.tvaApplicable ? facture.montantTotal / (1 + tvaRate) : facture.montantTotal;
  const montantTVA = facture.tvaApplicable ? facture.montantTotal - montantHorsTaxe : 0;

  return (
    <div ref={ref} className="bg-white text-black p-6 font-mono text-[10px] w-[210mm] min-h-[297mm] border border-gray-300">
      
      <header className="text-center mb-4">
          <h1 className="text-xl font-bold">SOCIETE TOGOLAISE D'AUTOMOBILE</h1>
          <p className="text-[8px] uppercase">Concessionnaire automobile, Commerce général, Import-Export, Vente et distribution de véhicules, pièces détachées, pneus et lubrifiants moteur</p>
          <p className="text-[9px] font-semibold">NIF: 1001767190 RCCM: TG-LFW-01-2023-M-0034</p>
      </header>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p><span className="font-bold">Facture :</span> n°{String(facture.idFacture).padStart(4, '0')}V/{new Date(facture.dateFacture).getFullYear()}/STA</p>
          <p><span className="font-bold">Date :</span> {facture.dateFacture ? format(new Date(facture.dateFacture), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Doit : {facture.clientNom}</p>
          {facture.clientAdresse && <p>{facture.clientAdresse}</p>}
        </div>
      </div>
      
      <div className="mb-4">
        <span className="font-bold">Objet :</span> Vente de produits
      </div>

      <table className="w-full border-collapse border border-black text-[10px]">
        <thead>
          <tr className="border-b border-black bg-gray-100">
            <th className="border-r border-black p-1 w-24">Réf</th>
            <th className="border-r border-black p-1">Désignation</th>
            <th className="border-r border-black p-1 w-12">Qté</th>
            <th className="border-r border-black p-1 w-20">P. U. HT</th>
            <th className="p-1 w-24">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((ligne, index) => {
            const prixUnitaireHT = facture.tvaApplicable ? ligne.produitPrix / (1 + tvaRate) : ligne.produitPrix;
            const totalLigneHT = facture.tvaApplicable ? ligne.totalLigne / (1 + tvaRate) : ligne.totalLigne;
            return (
              <tr key={ligne.id} className="border-b border-black">
                <td className="border-r border-black p-1">{ligne.produitRef}</td>
                <td className="border-r border-black p-1">{ligne.produitNom}</td>
                <td className="border-r border-black p-1 text-center">{ligne.qteVoulu}</td>
                <td className="border-r border-black p-1 text-right">{formatCurrency(prixUnitaireHT)}</td>
                <td className="p-1 text-right">{formatCurrency(totalLigneHT)}</td>
              </tr>
            )
          })}
          {Array.from({ length: Math.max(0, 10 - facture.lignes.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-black h-6">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
            <tr className="font-bold">
                <td colSpan={4} className="border-t-2 border-black p-1 text-right">Montant Hors Taxe</td>
                <td className="border-t-2 border-black p-1 text-right">{formatCurrency(Math.round(montantHorsTaxe))}</td>
            </tr>
            {facture.tvaApplicable && (
                <tr className="font-bold">
                    <td colSpan={4} className="p-1 text-right">Montant de la TVA (18%)</td>
                    <td className="p-1 text-right">{formatCurrency(Math.round(montantTVA))}</td>
                </tr>
            )}
            <tr className="font-bold bg-gray-100">
                <td colSpan={4} className="border-t border-black p-1 text-right">Montant Total TTC</td>
                <td className="border-t border-black p-1 text-right">{formatCurrency(facture.montantTotal)}</td>
            </tr>
        </tfoot>
      </table>

      <div className="mt-4">
        <p>Arrêtée la présente facture à la somme de : {numberToWords(facture.montantTotal)} francs CFA</p>
      </div>

      <div className="flex justify-end mt-8">
        <div className="text-center">
            <p className="font-bold underline">Le Comptable</p>
        </div>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
