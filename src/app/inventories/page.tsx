
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import type { Inventaire, InventaireBrouillon } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, ClipboardList, Eye, Loader2, Download, Trash2, Edit, Pencil, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function InventoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [drafts, setDrafts] = useState<InventaireBrouillon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<number | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [inventairesData, draftsData] = await Promise.all([
            api.getInventaires(),
            api.getInventairesBrouillon()
        ]);
        setInventaires(inventairesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDrafts(draftsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [toast]);
  
  const handleExport = async (id: number) => {
    setExportingId(id);
    try {
        toast({ title: "Préparation de l'export...", description: "Le téléchargement va bientôt commencer."});
        await api.exportInventaire(id);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: "destructive", title: "Erreur d'exportation", description: errorMessage });
    } finally {
        setExportingId(null);
    }
  }

  const deleteDraft = async (draftId: number) => {
    try {
        await api.deleteInventaireBrouillon(draftId);
        toast({ title: "Brouillon supprimé" });
        await fetchData();
    } catch(e) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le brouillon." });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Gestion des Inventaires</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => router.push('/inventories/new')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nouvel Inventaire
          </Button>
        </div>
      </div>

      {drafts.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Brouillons d'Inventaire</CardTitle>
                <CardDescription>Reprenez un inventaire que vous avez commencé.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom du brouillon</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Nb. Produits</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts.map(draft => (
                                <TableRow key={draft.id}>
                                    <TableCell className="font-medium">Brouillon #{draft.id}</TableCell>
                                    <TableCell>{format(new Date(draft.date), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                                    <TableCell className="text-right">{draft.lignes?.length || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/inventories/new?draft=${draft.id}`)}>
                                            <Pencil className="h-4 w-4 mr-2"/> Continuer
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer le brouillon #{draft.id} ?</AlertDialogTitle>
                                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteDraft(draft.id)}>Supprimer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ClipboardList /> Historique des inventaires</CardTitle>
          <CardDescription>Liste de tous les inventaires soumis et validés.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Inventaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Nb. Lignes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : inventaires.length > 0 ? inventaires.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">INV-{String(inv.id).padStart(5, '0')}</TableCell>
                    <TableCell>{format(new Date(inv.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</TableCell>
                    <TableCell><Badge variant="outline">{inv.charge}</Badge></TableCell>
                    <TableCell>{inv.lignes.length}</TableCell>
                    <TableCell>
                      <Badge variant={inv.statut === 'CONFIRME' ? 'default' : 'secondary'} className={cn(
                          inv.statut === 'EN_ATTENTE_CONFIRMATION' && 'bg-orange-100 text-orange-800',
                          inv.statut === 'CONFIRME' && 'bg-green-600 text-white'
                      )}>
                        {inv.statut === 'CONFIRME' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {inv.statut === 'CONFIRME' ? 'Confirmé' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/inventories/${inv.id}`)}>
                            <Eye className="h-4 w-4" /><span className="sr-only">Voir les détails</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/inventories/new?edit=${inv.id}`)}>
                            <Pencil className="h-4 w-4" /><span className="sr-only">Modifier</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExport(inv.id)} disabled={exportingId === inv.id}>
                           {exportingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                           <span className="sr-only">Exporter</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Aucun inventaire trouvé.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
