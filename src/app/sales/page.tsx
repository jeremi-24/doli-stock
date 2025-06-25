
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/app-provider';
import type { Vente, FactureModele } from '@/lib/types';
import { PlusCircle, Printer, FileText, Eye, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SaleDetailsDialog({ vente, factureModeles }: { vente: Vente, factureModeles: FactureModele[] }) {
    const { shopInfo } = useApp();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    const template = factureModeles.find(m => m.id === vente.facture_modele_id);

    const handlePrint = () => { 
        const printWindow = window.open('', '_blank');
        const contentToPrint = document.getElementById(`invoice-print-${vente.id}`)?.innerHTML;
        
        if (printWindow && contentToPrint) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Facture ${vente.id.substring(vente.id.length-6)}</title>
                        <style>
                            body { font-family: sans-serif; margin: 0; padding: 20px; }
                            .print-container { max-width: 800px; margin: auto; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .text-right { text-align: right; }
                            .font-bold { font-weight: bold; }
                            .text-lg { font-size: 1.125rem; }
                            .text-sm { font-size: 0.875rem; }
                            .text-muted-foreground { color: #64748b; }
                            .mt-8 { margin-top: 2rem; }
                            .pt-8 { padding-top: 2rem; }
                            .mb-8 { margin-bottom: 2rem; }
                            .border-t { border-top: 1px solid #ddd; }
                            .text-center { text-align: center; }
                            .flex { display: flex; }
                            .justify-between { justify-content: space-between; }
                            .items-start { align-items: flex-start; }
                            .mx-auto { margin-left: auto; margin-right: auto; }
                        </style>
                    </head>
                    <body>
                        ${contentToPrint}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const primaryColorStyle = template?.primaryColor ? { color: `hsl(${template.primaryColor})` } : {};

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                 <div id={`invoice-print-${vente.id}`} className="print-container p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {template?.logoUrl ? (
                                <img src={template.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                            ) : (
                                <h2 className="text-2xl font-bold" style={primaryColorStyle}>{shopInfo.name}</h2>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">{shopInfo.address}</p>
                            <p className="text-sm text-muted-foreground">{shopInfo.phone}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold" style={primaryColorStyle}>
                                {template?.headerContent || 'FACTURE'}
                            </h1>
                            <p className="text-muted-foreground">N° : {vente.id.substring(vente.id.length-6)}</p>
                            <p className="text-muted-foreground">Date : {format(new Date(vente.date_vente), 'd MMMM yyyy', { locale: fr })}</p>
                        </div>
                    </div>
                     {/* Client Info */}
                    <div className="mb-8">
                        <p className="text-muted-foreground">Facturé à :</p>
                        <p className="font-semibold">{vente.client}</p>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[100px] text-center">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>{vente.lignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produit.nom}</TableCell><TableCell className="text-center">{l.quantite}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_unitaire)}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_total)}</TableCell></TableRow>))}</TableBody>
                            <TableFooter>
                                <TableRow className="text-base font-bold"><TableCell colSpan={3} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(vente.montant_total)}</TableCell></TableRow>
                                <TableRow><TableCell colSpan={3} className="text-right font-semibold">Montant Payé ({vente.type_paiement})</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.montant_paye)}</TableCell></TableRow>
                                <TableRow><TableCell colSpan={3} className="text-right font-semibold">Reste / Monnaie</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.montant_paye - vente.montant_total)}</TableCell></TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                       {template?.footerContent ? (
                            <p>{template.footerContent}</p>
                        ) : (
                            <p>Merci pour votre confiance !</p>
                        )}
                    </div>
                </div>
                <DialogFooter className="no-print"><Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Imprimer</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SalesPage() {
  const { ventes, factureModeles } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const filteredSales = useMemo(() => {
      return [...ventes]
        .sort((a, b) => new Date(b.date_vente).getTime() - new Date(a.date_vente).getTime())
        .filter(vente => vente.client.toLowerCase().includes(searchTerm.toLowerCase()) || vente.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ventes, searchTerm]);
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Historique des Ventes</h1>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"/>
           </div>
          <Button size="sm" onClick={() => router.push('/invoicing')}><PlusCircle className="h-4 w-4 mr-2" />Créer une Facture</Button>
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
                    <TableHeader><TableRow><TableHead>N° Vente</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Paiement</TableHead><TableHead className="text-right">Total</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                    <TableBody>
                    {filteredSales.length > 0 ? filteredSales.map(vente => (
                        <TableRow key={vente.id}>
                            <TableCell className="font-mono text-xs">{vente.id.substring(vente.id.length-6)}</TableCell>
                            <TableCell className="font-medium">{vente.client}</TableCell>
                            <TableCell>{format(new Date(vente.date_vente), 'd MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell><Badge variant={vente.type === 'pos' ? 'secondary' : 'default'}>{vente.type.toUpperCase()}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{vente.type_paiement}</Badge></TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(vente.montant_total)}</TableCell>
                            <TableCell className="text-right"><SaleDetailsDialog vente={vente} factureModeles={factureModeles} /></TableCell>
                        </TableRow>
                    )) : (<TableRow><TableCell colSpan={7} className="h-24 text-center">{searchTerm ? "Aucune vente ne correspond à votre recherche." : "Aucune vente trouvée."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
