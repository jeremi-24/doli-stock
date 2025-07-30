
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Vente, VenteLigne } from '@/lib/types';
import * as api from '@/lib/api';
import { Eye, Search, History, Loader2, User, Tag, ShoppingCart, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


function SaleDetailsDialog({ vente }: { vente: Vente }) {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Détails de la Vente #{vente.ref}</DialogTitle>
                    <DialogDescription>
                        Vente effectuée le {vente.date ? format(new Date(vente.date), 'd MMMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="p-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Client : </span><span className="font-semibold">{vente.client?.nom || 'N/A'}</span></div>
                        <div><span className="text-muted-foreground">Caissier : </span><span className="font-semibold">{vente.caissier}</span></div>
                    </div>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="text-center">Qté</TableHead><TableHead className="text-center">Type</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{vente.lignes.map(l => (
                                <TableRow key={l.id}>
                                    <TableCell className="font-medium">{l.produitNom}</TableCell>
                                    <TableCell className="text-center">{l.qteVendueTotaleUnites}</TableCell>
                                    <TableCell className="text-center">{l.typeQuantite}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(l.produitPrix)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(l.total)}</TableCell>
                                </TableRow>
                            ))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={4} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(vente.total)}</TableCell></TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function SalesPage() {
  const { hasPermission, annulerVente } = useApp();
  const { toast } = useToast();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const fetchVentes = React.useCallback(async () => {
    if (!hasPermission('VENTE_READ')) return setIsLoading(false);
    try {
        setIsLoading(true);
        const data = await api.getVentes();
        setVentes(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }, [toast, hasPermission]);

  useEffect(() => {
    fetchVentes();
  }, [fetchVentes]);


  const filteredSales = useMemo(() => {
    if (isLoading) return [];
    return ventes.filter(vente => 
          (vente.client?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (vente.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (vente.caissier || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [ventes, searchTerm, isLoading]);
  
  const handleCancelSale = async (id: number) => {
    setIsCancelling(id);
    try {
        await annulerVente(id);
        await fetchVentes();
    } finally {
        setIsCancelling(null);
    }
  }

  if (!hasPermission('VENTE_READ')) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
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
        <h1 className="font-headline text-3xl font-semibold">Historique des Ventes</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Chercher par réf, client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart />Toutes les ventes directes</CardTitle>
              <CardDescription>Liste de toutes les transactions effectuées au point de vente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Caissier</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-center w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredSales.length > 0 ? filteredSales.map(vente => {
                        const isAnnulee = vente.statut === 'ANNULEE';
                        return (
                        <TableRow key={vente.id} className={cn(isAnnulee && "bg-destructive/10 text-muted-foreground")}>
                            <TableCell className="font-mono text-xs">{vente.ref}</TableCell>
                            <TableCell>{vente.date ? format(new Date(vente.date), 'd MMM yyyy, HH:mm', { locale: fr }) : "N/A"}</TableCell>
                            <TableCell className="font-medium">{vente.client?.nom || 'N/A'}</TableCell>
                            <TableCell>{vente.caissier}</TableCell>
                            <TableCell className={cn("text-right font-semibold", !isAnnulee && "text-foreground")}>{formatCurrency(vente.total)}</TableCell>
                            <TableCell className="text-center">
                               {isAnnulee ? (
                                    <Badge variant="destructive">Annulée</Badge>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <SaleDetailsDialog vente={vente} />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isCancelling === vente.id}>
                                                    {isCancelling === vente.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Annuler la vente #{vente.ref}?</AlertDialogTitle>
                                                    <AlertDialogDesc>
                                                        Cette action est irréversible. Elle annulera la vente et restaurera le stock des produits concernés.
                                                    </AlertDialogDesc>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelSale(vente.id)}>Confirmer l'annulation</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    )}) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune vente ne correspond à votre recherche." : "Aucune vente trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
