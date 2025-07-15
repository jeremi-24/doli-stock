
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/app-provider';
import type { Vente, VenteLigneApi, ShopInfo, Produit } from '@/lib/types';
import { PlusCircle, Eye, Search, History, Trash2, Loader2, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceTemplate } from '@/components/invoice-template';
import { useToast } from '@/hooks/use-toast';

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

    const totalVente = useMemo(() => {
        return enrichedLignes.reduce((sum, ligne) => sum + ligne.total, 0);
    }, [enrichedLignes]);

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
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[100px] text-center">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{enrichedLignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produitNom}</TableCell><TableCell className="text-center">{l.qteVendu}</TableCell><TableCell className="text-right">{formatCurrency(l.produitPrix)}</TableCell><TableCell className="text-right">{formatCurrency(l.total)}</TableCell></TableRow>))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={3} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(totalVente)}</TableCell></TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InvoicePreviewDialog({ vente, shopInfo, produits, isOpen, onOpenChange }: { vente: Vente | null, shopInfo: ShopInfo, produits: Produit[], isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const invoiceRef = React.useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const { toast } = useToast();

    const enrichedVente = useMemo(() => {
        if (!vente) return null;
        const enrichedLignes = vente.lignes.map(ligne => {
            const produit = produits.find(p => p.id === ligne.produitId);
            return { ...ligne, produitNom: produit?.nom || `ID: ${ligne.produitId}` };
        });
        const total = enrichedLignes.reduce((sum, ligne) => sum + ligne.total, 0);
        return { ...vente, lignes: enrichedLignes, paiement: total };
    }, [vente, produits]);

    const handleGeneratePdf = async () => {
        const input = invoiceRef.current;
        if (!input) {
            toast({ variant: 'destructive', title: 'Erreur', description: "L'élément de facture est introuvable." });
            return;
        }

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true, 
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const imgHeight = pdfWidth / ratio;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`facture-${enrichedVente?.ref || 'vente'}.pdf`);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erreur de génération', description: "Impossible de générer le PDF." });
        } finally {
            setIsGenerating(false);
            onOpenChange(false);
        }
    };

    if (!enrichedVente) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="font-headline">Aperçu de la Facture</DialogTitle>
                    <DialogDescription>
                        Aperçu de la facture pour la vente #{enrichedVente.ref}. Cliquez sur "Télécharger" pour obtenir le PDF.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-auto bg-gray-200 p-4 rounded-md">
                     <div ref={invoiceRef}>
                         <InvoiceTemplate vente={enrichedVente} shopInfo={shopInfo} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Fermer</Button>
                    <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                        {isGenerating ? "Génération..." : "Télécharger le PDF"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteSaleButton({ venteId, onDeleted }: { venteId: number, onDeleted: () => void }) {
    const { deleteVente } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleDelete = async () => {
        setIsLoading(true);
        await deleteVente(venteId);
        onDeleted(); 
        setIsLoading(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Supprimer la vente">
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
  const { ventes, shopInfo, produits, isMounted } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenteForInvoice, setSelectedVenteForInvoice] = useState<Vente | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const filteredSales = useMemo(() => {
    if (!isMounted) return [];
    return [...ventes]
      .sort((a, b) => {
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
  
  const handleOpenInvoiceDialog = (vente: Vente) => {
    setSelectedVenteForInvoice(vente);
  };
  
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
                            <TableHead className="text-center w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {!isMounted ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6} className="h-12"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></TableCell></TableRow>
                        ))
                    ) : filteredSales.length > 0 ? filteredSales.map(vente => {
                        const totalVente = vente.lignes.reduce((sum, l) => sum + l.total, 0);
                        return (
                        <TableRow key={vente.id}>
                            <TableCell className="font-mono text-xs">{vente.ref || 'N/A'}</TableCell>
                            <TableCell className="font-medium">{vente.client || 'N/A'}</TableCell>
                            <TableCell><Badge variant="outline">{vente.caissier || 'N/A'}</Badge></TableCell>
                            <TableCell>{vente.date ? format(new Date(vente.date), 'd MMM yyyy, HH:mm', { locale: fr }) : "N/A"}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(totalVente)}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                    <SaleDetailsDialog vente={vente} />
                                    <Button variant="ghost" size="icon" aria-label="Générer la facture" onClick={() => handleOpenInvoiceDialog(vente)}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <DeleteSaleButton venteId={vente.id} onDeleted={() => {}}/>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune vente ne correspond à votre recherche." : "Aucune vente trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
        <InvoicePreviewDialog
            vente={selectedVenteForInvoice}
            shopInfo={shopInfo}
            produits={produits}
            isOpen={!!selectedVenteForInvoice}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedVenteForInvoice(null);
                }
            }}
        />
    </div>
  );
}
