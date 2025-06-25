
import React from 'react';
import Link from 'next/link';

export default function ProductsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Produits</h1>
      <p>La gestion des produits se fait désormais dans la section "Stock".</p>
       <p>
         <Link href="/stock" className="text-primary underline">
           Aller à la page Stock
         </Link>
       </p>
    </div>
  );
};
