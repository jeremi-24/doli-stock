
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Facture } from '@/lib/types';
import * as api from '@/lib/api';
import { Eye, Search, FileText, Loader2, Trash2, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-provider';

export default function InvoicesPage() {
  const { factures, fetchFactures, deleteFacture, hasPermission } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await fetchFactures();
      setIsLoading(false);
    }
    loadData();
  }, [fetchFactures]);

  const filteredInvoices = useMemo(() => {
    if (isLoading) return [];
    return factures.filter(facture => 
          (facture.clientNom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (String(facture.idFacture) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (String(facture.commandeId) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [factures, searchTerm, isLoading]);
  
  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    await deleteFacture(id);
    setIsDeleting(null);
  }
  
  if (!hasPermission('FACTURE_GENERATE')) {
    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                 <CardHeader className="items-center">
                    <FileWarning className="w-12 h-12 text-destructive" />
                    <CardTitle>Accès non autorisé</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Vous n'avez pas les permissions nécessaires pour voir cette page.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Liste des Factures</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Chercher par N°, client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><FileText />Toutes les factures</CardTitle>
              <CardDescription>Liste de toutes les factures générées à partir des commandes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° Facture</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>N° Commande</TableHead>
                            <TableHead className="text-right">Montant Total</TableHead>
                            <TableHead className="text-center w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredInvoices.length > 0 ? filteredInvoices.map(facture => {
                        return (
                        <TableRow key={facture.idFacture}>
                            <TableCell className="font-mono text-xs">FACT-{String(facture.idFacture).padStart(5, '0')}</TableCell>
                            <TableCell>{facture.dateFacture ? format(new Date(facture.dateFacture), 'd MMM yyyy', { locale: fr }) : "N/A"}</TableCell>
                            <TableCell className="font-medium">{facture.clientNom || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">CMD-{String(facture.commandeId).padStart(5, '0')}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(facture.montantTotal)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" aria-label="Voir le document" onClick={() => router.push(`/orders/${facture.commandeId}`)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isDeleting === facture.idFacture}>
                                            {isDeleting === facture.idFacture ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Elle supprimera définitivement la facture FACT-{String(facture.idFacture).padStart(5, '0')}.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(facture.idFacture)}>Supprimer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )}) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune facture ne correspond à votre recherche." : "Aucune facture trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
