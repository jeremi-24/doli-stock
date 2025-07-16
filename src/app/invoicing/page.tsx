

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a redirect. The new order creation process starts at /orders/new
export default function InvoicingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders/new');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <p>Redirection vers la nouvelle page de commande...</p>
    </div>
  );
}
