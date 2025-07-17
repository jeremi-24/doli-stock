
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/app-provider';
import type { Facture, Produit, ShopInfo } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, Eye, Search, History, Trash2, Loader2, FileText, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InvoiceTemplate } from '@/components/invoice-template';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

function SaleDetailsDialog({ facture }: { facture: Facture }) {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Détails de la Facture #{facture.idFacture}</DialogTitle>
                    <DialogDescription>
                        Facture générée le {facture.dateFacture ? format(new Date(facture.dateFacture), 'd MMMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="p-2 space-y-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Client : </span>
                        <span className="font-semibold">{facture.clientNom}</span>
                    </div>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Référence</TableHead><TableHead className="w-[100px] text-center">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{facture.lignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produitNom}</TableCell><TableCell>{l.produitRef}</TableCell><TableCell className="text-center">{l.qteVoulu}</TableCell><TableCell className="text-right">{formatCurrency(l.produitPrix)}</TableCell><TableCell className="text-right">{formatCurrency(l.totalLigne)}</TableCell></TableRow>))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={4} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(facture.montantTotal)}</TableCell></TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InvoicePreviewDialog({ facture, shopInfo, isOpen, onOpenChange }: { facture: Facture | null, shopInfo: ShopInfo, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handlePrint = useReactToPrint({
      content: () => invoiceRef.current,
      onAfterPrint: () => onOpenChange(false),
      onPrintError: () => toast({ variant: 'destructive', title: 'Erreur d\'impression', description: 'Veuillez réessayer.' }),
    });

    if (!facture) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline">Aperçu de la Facture</DialogTitle>
                    <DialogDescription>
                        Aperçu de la facture #{facture.idFacture}.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-auto bg-gray-200 p-4 rounded-md flex-1">
                     <InvoiceTemplate ref={invoiceRef} facture={facture} shopInfo={shopInfo} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4"/>Imprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteSaleButton({ factureId, onDeleted }: { factureId: number, onDeleted: () => void }) {
    const { deleteFacture } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleDelete = async () => {
        setIsLoading(true);
        await deleteFacture(factureId);
        onDeleted(); 
        setIsLoading(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Supprimer la facture">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement cette facture et les documents associés. Le stock ne sera PAS impacté.
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
  const { factures, shopInfo, isMounted, fetchFactures } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFactureForInvoice, setSelectedFactureForInvoice] = useState<Facture | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const filteredSales = useMemo(() => {
    if (!isMounted) return [];
    return [...factures]
      .sort((a, b) => {
        if (!a.dateFacture) return 1;
        if (!b.dateFacture) return -1;
        return new Date(b.dateFacture).getTime() - new Date(a.dateFacture).getTime();
      })
      .filter(facture => 
          (facture.clientNom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (String(facture.idFacture) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [factures, searchTerm, isMounted]);
  
  const handleOpenInvoiceDialog = (facture: Facture) => {
    setSelectedFactureForInvoice(facture);
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Historique des Factures</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><History />Toutes les factures</CardTitle>
              <CardDescription>Liste de toutes les factures générées.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° Facture</TableHead>
                            <TableHead>N° Commande</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-center w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {!isMounted ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6} className="h-12"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></TableCell></TableRow>
                        ))
                    ) : filteredSales.length > 0 ? filteredSales.map(facture => {
                        return (
                        <TableRow key={facture.idFacture}>
                            <TableCell className="font-mono text-xs">FACT-{String(facture.idFacture).padStart(5, '0')}</TableCell>
                            <TableCell className="font-mono text-xs">CMD-{String(facture.commandeId).padStart(5, '0')}</TableCell>
                            <TableCell className="font-medium">{facture.clientNom || 'N/A'}</TableCell>
                            <TableCell>{facture.dateFacture ? format(new Date(facture.dateFacture), 'd MMM yyyy, HH:mm', { locale: fr }) : "N/A"}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(facture.montantTotal)}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                    <SaleDetailsDialog facture={facture} />
                                    <Button variant="ghost" size="icon" aria-label="Générer la facture" onClick={() => handleOpenInvoiceDialog(facture)}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <DeleteSaleButton factureId={facture.idFacture} onDeleted={() => fetchFactures()}/>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune facture ne correspond à votre recherche." : "Aucune facture trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
        <InvoicePreviewDialog
            facture={selectedFactureForInvoice}
            shopInfo={shopInfo}
            isOpen={!!selectedFactureForInvoice}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedFactureForInvoice(null);
                }
            }}
        />
    </div>
  );
}
