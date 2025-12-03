"use client";

import type { ShopInfo, Facture } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';

// Fonction utilitaire pour convertir les nombres en lettres (Format Français)
function numberToWords(num: number): string {
  const a = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const b = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  
  // Fonction interne récursive simplifiée
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      // Gestion des 70, 90 (soixante-dix, quatre-vingt-dix)
      if (d === 7 || d === 9) {
        return b[d - 1] + (d===7 && u===1 ? '-et-' : '-') + (a[u + 10]);
      }
      return b[d] + (u > 0 ? (u === 1 && d !== 8 ? '-et-' : '-') + a[u] : '');
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      return (c > 1 ? a[c] + ' ' : '') + 'cent' + (r > 0 ? ' ' + convert(r) : (c > 1 ? 's' : ''));
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      const r = n % 1000;
      return (m > 1 ? convert(m) + ' ' : '') + 'mille' + (r > 0 ? ' ' + convert(r) : '');
    }
    if (n < 1000000000) {
      const m = Math.floor(n / 1000000);
      const r = n % 1000000;
      return convert(m) + ' million' + (m > 1 ? 's' : '') + (r > 0 ? ' ' + convert(r) : '');
    }
    return n.toString();
  };

  return convert(num);
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, { facture: Facture, shopInfo: ShopInfo,withHeader?: boolean }>(({ shopInfo, facture , withHeader = true}, ref) => {
  // État pour gérer l'erreur de chargement du logo (comme dans l'exemple AppShell)
  const [logoError, setLogoError] = React.useState(false);

  // Formatage monétaire (espace comme séparateur de milliers)
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount);

  // Calculs logique conservée
  const tvaRate = 0.18;
  const montantHorsTaxe = facture.tvaApplicable ? facture.montantTotal / (1 + tvaRate) : facture.montantTotal;
  const montantTVA = facture.tvaApplicable ? facture.montantTotal - montantHorsTaxe : 0;

  return (
    <div ref={ref}   className="bg-white text-black p-8 font-sans text-[11px] w-[210mm] h-[297mm] flex flex-col justify-arround leading-snug"
>
      
      {/* HEADER : LOGO & INFOS SOCIETE */}
      {withHeader && (
        <header className="text-center mb-8 relative">
          <div className="flex items-center justify-center mb-1 h-32 w-full">
            {shopInfo.logoUrl && !logoError ? (
              <img
                src={shopInfo.logoUrl}
                alt={`${shopInfo.nom} Logo`}
                className="h-full w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <img src="/logosta.png" alt="Logo par défaut" className="h-48 w-auto object-contain" />
            )}
          </div>
          <div className="text-[9px] uppercase font-medium text-gray-700 space-y-0.5">
            <p>Concessionnaire automobile, Commerce général, Import-Export,</p>
            <p>Vente et distribution de véhicules, pièces détachées, pneus et lubrifiants moteur</p>
          </div>
          <div className="mt-2 text-[10px] font-bold border-t border-gray-300 w-fit mx-auto pt-1 px-4">
            NIF: 1001767190 &nbsp;|&nbsp; RCCM: TG-LFW-01-2023-M-0034
          </div>
          <div className="absolute top-10 right-0 handwriting text-gray-400 text-xs">{/* espace pour notation */}</div>
        </header>
      )}
      
      {/* BLOC INFO FACTURE & CLIENT */}
      <div className="flex justify-between items-start mb-8 mt-4">
        {/* Côté Gauche : Réf Facture */}
        <div className="space-y-1">
          <p className="text-sm"><span className="font-bold underline">Facture :</span> n°{String(facture.idFacture).padStart(4, '0')}V/{new Date(facture.dateFacture).getFullYear()}/STA</p>
          <p className="text-sm"><span className="font-bold">Date :</span> {facture.dateFacture ? format(new Date(facture.dateFacture), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</p>
          
        </div>

        {/* Côté Droit : Info Client */}
        <div className="text-right w-1/2">
          <p className="font-bold text-sm mb-1"><span className="underline">Doit</span> : {facture.clientNom.toUpperCase()}</p>
          {facture.clientAdresse && <p className="text-xs mb-1">{facture.clientAdresse}</p>}
          {/* Ajout du téléphone si disponible, sinon espace vide */}
          <p className="text-xs font-semibold">Tel : {facture.clientAdresse || '(+228) -- -- -- --'}</p>
        </div>
      </div>
      
      {/* OBJET */}
      <div className="mb-4">
        <span className="font-bold underline text-sm">Objet :</span> <span className="text-sm">Vente d'huile à moteur / Pièces</span>
      </div>
<div className='mb-2'>
      {/* TABLEAU PRINCIPAL */}
      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="bg-gray-100 text-black font-bold text-center">
            <th className="border border-black p-1 w-12">Réf</th>
            <th className="border border-black p-1 text-left">Désignation</th>
            <th className="border border-black p-1 w-10">Qté</th>
            <th className="border border-black p-1 w-24">P. U.</th>
            <th className="border border-black p-1 w-28">Montant</th>
          </tr>
        </thead>
       <tbody>
  {facture.lignes.map((ligne, index) => {
    const prixUnitaireHT = facture.tvaApplicable ? ligne.produitPrix / (1 + tvaRate) : ligne.produitPrix;
    const totalLigneHT = facture.tvaApplicable ? ligne.totalLigne / (1 + tvaRate) : ligne.totalLigne;

    return (
      <tr key={ligne.id} className="border border-black h-8">
        <td className="border-r border-black p-1 text-center font-medium">{index + 1}</td>
        <td className="border-r border-black p-1">{ligne.produitNom} {ligne.produitRef ? `- ${ligne.produitRef}` : ''}</td>
        <td className="border-r border-black p-1 text-center">{ligne.qteVoulu}</td>
        <td className="border-r border-black p-1 text-right">{formatCurrency(Math.round(prixUnitaireHT))}</td>
        <td className="p-1 text-right font-medium">{formatCurrency(Math.round(totalLigneHT))}</td>
      </tr>
    )
  })}

  {/* Ligne TVA juste après les produits 
  {facture.tvaApplicable && (
    <tr className="font-bold bg-gray-100">
      <td colSpan={4} className="border border-black p-1 text-left">TVA (18%)</td>
      <td className="border border-black p-1 text-right">{formatCurrency(Math.round(montantTVA))}</td>
    </tr>
  )}
  */}
</tbody>


        {/* PIED DU TABLEAU (TOTAUX) */}
        <tfoot className="font-bold text-black bg-gray-50">
  {/* Montant HT */}
  <tr>
    <td colSpan={3} className="bg-white border-none"></td>
    <td className="border border-black p-1 pl-2 text-left bg-gray-200">Montant Hors Taxe</td>
    <td className="border border-black p-1 text-right">{formatCurrency(Math.round(montantHorsTaxe))}</td>
  </tr>

  {/* TVA */}
  {facture.tvaApplicable && (
    <tr>
      <td colSpan={3} className="bg-white border-none"></td>
      <td className="border border-black p-1 pl-2 text-left bg-gray-200">Montant de la TVA (18%)</td>
      <td className="border border-black p-1 text-right">{formatCurrency(Math.round(montantTVA))}</td>
    </tr>
  )}

  {/* Total TTC */}
  <tr>
    <td colSpan={3} className="bg-white border-none"></td>
    <td className="border border-black p-1 pl-2 text-left bg-gray-200">Montant Total TTC</td>
    <td className="border border-black p-1 text-right">{formatCurrency(facture.montantTotal)}</td>
  </tr>
</tfoot>

      </table>

      {/* MONTANT EN LETTRES + SIGNATURE */}
      <div className="flex flex-col mt-4">
  {/* Montant en lettres, aligné à gauche */}
  <div className="italic text-md font-medium">
    Arrêtée la présente facture à la somme de :{' '}
    <span className="font-bold">
      {numberToWords(facture.montantTotal)} francs CFA ({formatCurrency(facture.montantTotal)} F)
    </span>
  </div>

  {/* Signature, aligné à droite */}
  <div className="flex justify-end mt-4 flex-col items-end">
    <p className="font-bold text-lg ">Le Comptable</p>
    <p className="font-medium mt-16">ALFA TRAORE ABOUBACAR</p>
  </div>
</div>

</div>

      
     

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';