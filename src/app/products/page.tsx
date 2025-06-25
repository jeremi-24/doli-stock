
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/stock');
  }, [router]);

  return (
    <div className="w-full h-full p-8 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  );
};
