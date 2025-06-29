
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import type { Reapprovisionnement } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, PackagePlus, Eye, Loader2, User, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

function ReapproDetailsDialog({ reappro }: { reappro: Reapprovisionnement }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Détails du Réapprovisionnement</DialogTitle>
                    <DialogDescription>
                        Réapprovisionnement de la source <span className="font-semibold">{reappro.source}</span> par <span className="font-semibold">{reappro.agent}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="border rounded-lg mt-4">
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
            </DialogContent>
        </Dialog>
    )
}

export default function ReapprovisionnementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reapprovisionnements, setReapprovisionnements] = useState<Reapprovisionnement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReapprovisionnements() {
      try {
        setIsLoading(true);
        const data = await api.getReapprovisionnements();
        // Add a client-side date and ID for display purposes, as the API doesn't provide them
        const processedData = data.map((item, index) => ({
            ...item,
            id: item.id ?? `reappro-${Date.now()}-${index}`,
            date: item.date ?? new Date().toISOString(),
        })).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

        setReapprovisionnements(processedData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
    fetchReapprovisionnements();
  }, [toast]);

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
                  <TableHead>Source</TableHead>
                  <TableHead>Nb. Lignes</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : reapprovisionnements.length > 0 ? reapprovisionnements.map(reappro => (
                  <TableRow key={reappro.id}>
                    <TableCell>{reappro.date ? format(new Date(reappro.date), 'd MMMM yyyy à HH:mm', { locale: fr }) : 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline" className="flex items-center gap-1.5"><User className="h-3 w-3" /> {reappro.agent}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="flex items-center gap-1.5"><ChevronsRight className="h-3 w-3" /> {reappro.source}</Badge></TableCell>
                    <TableCell>{reappro.lignes.length}</TableCell>
                    <TableCell className="text-right">
                        <ReapproDetailsDialog reappro={reappro} />
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
