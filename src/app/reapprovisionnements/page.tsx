
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import type { Reapprovisionnement } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, PackagePlus, Eye, Loader2, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-provider';

export default function ReapprovisionnementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isMounted, hasPermission } = useApp();
  const [reapprovisionnements, setReapprovisionnements] = useState<Reapprovisionnement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canReadAll = useMemo(() => hasPermission('ALL_STOCK_READ'), [hasPermission]);

  useEffect(() => {
    async function fetchReapprovisionnements() {
      if (!isMounted || !currentUser) return;
      setIsLoading(true);
      try {
        let data: Reapprovisionnement[] = [];
        if (canReadAll) {
          data = await api.getReapprovisionnements();
        } else if (currentUser.lieuStockId) {
          data = await api.getReapprovisionnementsByLieu(currentUser.lieuStockId);
        }
        setReapprovisionnements(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
    fetchReapprovisionnements();
  }, [toast, isMounted, currentUser, canReadAll]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Réapprovisionnements</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => router.push('/reapprovisionnements/new')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nouveau Réapprovisionnement
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><PackagePlus /> Historique des arrivages</CardTitle>
          <CardDescription>Liste de tous les réapprovisionnements effectués.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Lieu de Stock</TableHead>
                  <TableHead>Nb. Lignes</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : reapprovisionnements.length > 0 ? reapprovisionnements.map(reappro => (
                  <TableRow key={reappro.id}>
                    <TableCell>{format(new Date(reappro.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</TableCell>
                    <TableCell><Badge variant="outline" className="flex items-center gap-1.5"><User className="h-3 w-3" /> {reappro.agent}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {reappro.lieuStockNom}</Badge></TableCell>
                    <TableCell>{reappro.lignes.length}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => router.push(`/reapprovisionnements/${reappro.id}`)}>
                            <Eye className="h-4 w-4" /><span className="sr-only">Voir les détails</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun réapprovisionnement trouvé.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
