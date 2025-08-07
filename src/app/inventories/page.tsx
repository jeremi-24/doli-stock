
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import type { Inventaire } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, ClipboardList, Eye, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function InventoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchInventaires() {
      try {
        setIsLoading(true);
        const data = await api.getInventaires();
        setInventaires(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventaires();
  }, [toast]);
  
  const handleExport = async (id: number) => {
    setExportingId(id);
    try {
        toast({ title: "Préparation de l'export...", description: "Le téléchargement va bientôt commencer."});
        await api.exportInventaire(id);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: "Erreur d'exportation", description: errorMessage });
    } finally {
        setExportingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Historique des Inventaires</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => router.push('/inventories/new')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nouvel Inventaire
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ClipboardList /> Tous les inventaires</CardTitle>
          <CardDescription>Liste de tous les inventaires réalisés.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Inventaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Chargé de l'inventaire</TableHead>
                  <TableHead>Nombre de produit comptés</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : inventaires.length > 0 ? inventaires.map(inv => (
                  <TableRow key={inv.inventaireId}>
                    <TableCell className="font-mono text-xs">INV-{String(inv.inventaireId).padStart(5, '0')}</TableCell>
                    <TableCell>{format(new Date(inv.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</TableCell>
                    <TableCell><Badge variant="outline">{inv.charge}</Badge></TableCell>
                    <TableCell>{inv.lignes.length}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/inventories/${inv.inventaireId}`)}>
                            <Eye className="h-4 w-4" /><span className="sr-only">Voir les détails</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExport(inv.inventaireId)} disabled={exportingId === inv.inventaireId}>
                           {exportingId === inv.inventaireId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                           <span className="sr-only">Exporter</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun inventaire trouvé.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
