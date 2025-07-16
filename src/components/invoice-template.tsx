
"use client";

import type { ShopInfo, Facture } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function InvoiceTemplate({ shopInfo, facture }: { shopInfo: ShopInfo, facture: Facture }) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  return (
    <div className="bg-white text-black p-8 font-sans text-sm w-[210mm] min-h-[297mm]">
      {/* Header */}
      <header className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
        <div className="w-2/3">
          {shopInfo.logoUrl ? (
            <img 
              src={shopInfo.logoUrl} 
              alt={`${shopInfo.nom} Logo`} 
              className="h-16 w-auto max-w-full object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; const fallback = document.getElementById('logo-fallback'); if(fallback) fallback.style.display = 'block'; }}
            />
          ) : null}
           <h1 id="logo-fallback" className="text-3xl font-bold text-gray-800" style={{ display: shopInfo.logoUrl ? 'none' : 'block' }}>{shopInfo.nom}</h1>
          <p className="mt-4 text-gray-600">{shopInfo.adresse}</p>
          <p className="text-gray-600">{shopInfo.ville}</p>
          <p className="text-gray-600">{shopInfo.telephone}</p>
          <p className="text-gray-600">{shopInfo.email}</p>
        </div>
        <div className="w-1/3 text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Facture</h2>
          <p className="mt-2 text-gray-600">
            <span className="font-semibold">N° : </span>FACT-{String(facture.idFacture).padStart(5, '0')}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Date : </span>{facture.dateFacture ? format(new Date(facture.dateFacture), 'd MMMM yyyy', { locale: fr }) : 'N/A'}
          </p>
           {shopInfo.numero && <p className="mt-2 text-gray-600"><span className="font-semibold">ID Fiscal : </span>{shopInfo.numero}</p>}
        </div>
      </header>

      {/* Client Info */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Facturé à</h3>
        <p className="mt-2 font-bold text-lg text-gray-800">{facture.clientNom}</p>
      </section>

      {/* Table */}
      <section className="mt-8">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 font-semibold">Produit</th>
              <th className="p-3 font-semibold text-center w-24">Quantité</th>
              <th className="p-3 font-semibold text-right w-32">Prix Unitaire</th>
              <th className="p-3 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((ligne) => (
              <tr key={ligne.id} className="border-b border-gray-100">
                <td className="p-3">{ligne.produitNom}</td>
                <td className="p-3 text-center">{ligne.qteVoulu}</td>
                <td className="p-3 text-right">{formatCurrency(ligne.produitPrix)}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(ligne.totalLigne)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Total */}
      <section className="mt-8 flex justify-end">
        <div className="w-full max-w-xs">
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
            <span className="text-xl font-bold text-gray-800">TOTAL</span>
            <span className="text-xl font-bold text-gray-800">{formatCurrency(facture.montantTotal)}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-gray-500">
        <p>Merci de votre confiance.</p>
        <p>Généré par StockHero</p>
      </footer>
    </div>
  );
}
