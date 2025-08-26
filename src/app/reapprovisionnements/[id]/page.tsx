
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Truck, Calendar, Box, Package as UnitIcon, Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Reapprovisionnement, Produit } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '@/context/app-provider';
import { Badge } from '@/components/ui/badge';


export default function ReapprovisionnementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { produits } = useApp();
  
  const [reappro, setReappro] = useState<Reapprovisionnement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);

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
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4"/> Lieu de stock: <span className="font-medium text-foreground">{reappro.lieuStockNom}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Date: <span className="font-medium text-foreground">{format(new Date(reappro.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</span></div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Quantité Ajoutée</TableHead>
                            <TableHead className="text-right">Type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reappro.lignes.map((ligne) => {
                            const produit = productMap.get(ligne.produitId);
                            return (
                             <TableRow key={ligne.id}>
                                <TableCell>
                                  <div className="font-semibold text-md">{produit?.ref || 'N/A'}</div>
                                  <div className="text-lg text-muted-foreground  font-medium">{ligne.produitNom || produit?.nom || `Produit ID: ${ligne.produitId}`}</div>
                                </TableCell>
                                <TableCell className="text-right text-lg font-semibold text-green-600 font-medium">+{ligne.qteAjoutee}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={ligne.typeQuantite === 'CARTON' ? 'default' : 'secondary'}>
                                    {ligne.typeQuantite}
                                  </Badge>
                                </TableCell>
                             </TableRow>
                            )
                        })}
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
