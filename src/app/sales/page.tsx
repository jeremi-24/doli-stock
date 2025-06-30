
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/app-provider';
import type { Vente, VenteLigneApi } from '@/lib/types';
import { PlusCircle, Eye, Search, History, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SaleDetailsDialog({ vente }: { vente: Vente }) {
    const { produits } = useApp();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    const enrichedLignes = useMemo(() => {
        return vente.lignes.map(ligne => {
            const produit = produits.find(p => p.id === ligne.produitId);
            return {
                ...ligne,
                produitNom: produit?.nom || `ID: ${ligne.produitId}`,
            };
        });
    }, [vente.lignes, produits]);

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Détails de la Vente #{vente.ref}</DialogTitle>
                    <DialogDescription>
                        Vente réalisée le {vente.date ? format(new Date(vente.date), 'd MMMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'} par {vente.caissier}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="p-2 space-y-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Client : </span>
                        <span className="font-semibold">{vente.client}</span>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[100px] text-center">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{enrichedLignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produitNom}</TableCell><TableCell className="text-center">{l.qteVendu}</TableCell><TableCell className="text-right">{formatCurrency(l.produitPrix)}</TableCell><TableCell className="text-right">{formatCurrency(l.total)}</TableCell></TableRow>))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={3} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(vente.paiement)}</TableCell></TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DeleteSaleButton({ venteId, onDeleted }: { venteId: number, onDeleted: () => void }) {
    const { deleteVente } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleDelete = async () => {
        setIsLoading(true);
        await deleteVente(venteId);
        onDeleted(); // Let parent know to potentially close a dialog
        setIsLoading(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement cette vente et les lignes associées. Le stock ne sera PAS restauré.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                         {isLoading ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function SalesPage() {
  const { ventes, isMounted } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const filteredSales = useMemo(() => {
    if (!isMounted) return [];
    return [...ventes]
      .sort((a, b) => {
        // Handle cases where date might be null
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .filter(vente => 
          (vente.client || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (vente.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (vente.caissier || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [ventes, searchTerm, isMounted]);
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Historique des Ventes</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
          <Button size="sm" onClick={() => router.push('/invoicing')}><PlusCircle className="h-4 w-4 mr-2" />Créer une Vente</Button>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><History />Toutes les transactions</CardTitle>
              <CardDescription>Liste de toutes les ventes (PDV et manuelles).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Caissier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-center w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {!isMounted ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6} className="h-12"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></TableCell></TableRow>
                        ))
                    ) : filteredSales.length > 0 ? filteredSales.map(vente => (
                        <TableRow key={vente.id}>
                            <TableCell className="font-mono text-xs">{vente.ref}</TableCell>
                            <TableCell className="font-medium">{vente.client}</TableCell>
                            <TableCell><Badge variant="outline">{vente.caissier}</Badge></TableCell>
                            <TableCell>{vente.date ? format(new Date(vente.date), 'd MMM yyyy, HH:mm', { locale: fr }) : "N/A"}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(vente.paiement)}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                    <SaleDetailsDialog vente={vente} />
                                    <DeleteSaleButton venteId={vente.id} onDeleted={() => {}}/>
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune vente ne correspond à votre recherche." : "Aucune vente trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
