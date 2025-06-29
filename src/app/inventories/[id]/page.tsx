
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Hash, ArrowDownUp, Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Inventaire } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [inventory, setInventory] = useState<Inventaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
        async function fetchInventory() {
            try {
                setIsLoading(true);
                const data = await api.getInventaire(Number(id));
                setInventory(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger l'inventaire: ${errorMessage}` });
                router.push('/inventories');
            } finally {
                setIsLoading(false);
            }
        }
        fetchInventory();
    }
  }, [id, router, toast]);

  const EcartBadge = ({ ecart }: { ecart: number }) => {
    if (ecart === 0) {
      return <Badge variant="secondary" className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" />OK</Badge>;
    }
    const isPositive = ecart > 0;
    return (
      <Badge variant={isPositive ? 'default' : 'destructive'} className={cn(!isPositive && "bg-red-100 text-red-700 border-red-200", isPositive && "bg-green-100 text-green-700 border-green-200")}>
        {isPositive ? `+${ecart}` : ecart}
      </Badge>
    );
  };

  if (isLoading || !inventory) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-32" />
           </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/inventories')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Détails de l'Inventaire
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Inventaire N° INV-{String(inventory.inventaireId).padStart(5, '0')}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4"/> Chargé de l'inventaire: <span className="font-medium text-foreground">{inventory.charge}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Date: <span className="font-medium text-foreground">{format(new Date(inventory.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</span></div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Entrepôt</TableHead>
                            <TableHead className="text-center">Qté Avant</TableHead>
                            <TableHead className="text-center">Qté Scannée</TableHead>
                            <TableHead className="text-center">Écart</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.lignes.map(ligne => (
                             <TableRow key={ligne.produitId}>
                                <TableCell className="font-medium">{ligne.nomProduit}</TableCell>
                                <TableCell>{ligne.entrepotNom}</TableCell>
                                <TableCell className="text-center">{ligne.qteAvantScan}</TableCell>
                                <TableCell className="text-center font-semibold">{ligne.qteScanne}</TableCell>
                                <TableCell className="text-center"><EcartBadge ecart={ligne.ecart} /></TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/inventories')}>
                Retour à l'historique
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
