
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, ChevronsRight, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Reapprovisionnement } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ReapprovisionnementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [reappro, setReappro] = useState<Reapprovisionnement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
        async function fetchReappro() {
            try {
                setIsLoading(true);
                const data = await api.getReapprovisionnement(Number(id));
                setReappro(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger le réapprovisionnement: ${errorMessage}` });
                router.push('/reapprovisionnements');
            } finally {
                setIsLoading(false);
            }
        }
        fetchReappro();
    }
  }, [id, router, toast]);


  if (isLoading || !reappro) {
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
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/reapprovisionnements')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Détails du Réapprovisionnement
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2"><Truck /> Réapprovisionnement N°{String(reappro.id).padStart(5, '0')}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4"/> Agent: <span className="font-medium text-foreground">{reappro.agent}</span></div>
            <div className="flex items-center gap-2"><ChevronsRight className="h-4 w-4"/> Source: <span className="font-medium text-foreground">{reappro.source}</span></div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Entrepôt</TableHead>
                            <TableHead className="text-right">Quantité Ajoutée</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reappro.lignes.map((ligne) => (
                             <TableRow key={ligne.id}>
                                <TableCell className="font-medium">{ligne.produitNom}</TableCell>
                                <TableCell>{ligne.entrepotNom}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">+{ligne.qteAjoutee}</TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/reapprovisionnements')}>
                Retour à l'historique
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
