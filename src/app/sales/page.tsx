
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
import type { Vente } from '@/lib/types';
import { PlusCircle, Printer, FileText, Eye, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SaleDetailsDialog({ vente }: { vente: Vente }) {
    const { shopInfo } = useApp();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    const handlePrint = () => { /* Print logic can be implemented here */ };

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Voir les détails"><Eye className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <div id={`invoice-print-${vente.id}`} className="print-container">
                    <DialogHeader className="header">
                        <DialogTitle className="font-headline text-2xl">FACTURE #{vente.id.substring(vente.id.length-6)}</DialogTitle>
                        <DialogDescription>Date: {format(new Date(vente.date_vente), 'd MMMM yyyy', { locale: fr })}</DialogDescription>
                    </DialogHeader>
                     <div className="shop-info my-8 text-center"><h3 className="font-bold text-lg">{shopInfo.name}</h3><p className="text-sm text-muted-foreground">{shopInfo.address} | {shopInfo.phone}</p></div>
                    <div className="py-6 space-y-6">
                        <p><span className="font-semibold">Client:</span> {vente.client}</p>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="w-[100px]">Qté</TableHead><TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                <TableBody>{vente.lignes.map(l => (<TableRow key={l.id}><TableCell className="font-medium">{l.produit.nom}</TableCell><TableCell>{l.quantite}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_unitaire)}</TableCell><TableCell className="text-right">{formatCurrency(l.prix_total)}</TableCell></TableRow>))}</TableBody>
                                <TableFooter>
                                    <TableRow className="text-base font-bold"><TableCell colSpan={3} className="text-right">Montant Total</TableCell><TableCell className="text-right">{formatCurrency(vente.montant_total)}</TableCell></TableRow>
                                    <TableRow><TableCell colSpan={3} className="text-right font-semibold">Montant Payé ({vente.type_paiement})</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.montant_paye)}</TableCell></TableRow>
                                    <TableRow><TableCell colSpan={3} className="text-right font-semibold">Reste / Monnaie</TableCell><TableCell className="text-right font-semibold">{formatCurrency(vente.reste)}</TableCell></TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        <div className="text-center pt-10"><FileText className="mx-auto h-8 w-8 text-muted-foreground"/><p className="font-headline mt-2 text-xl">Merci pour votre confiance !</p></div>
                    </div>
                </div>
                <DialogFooter className="no-print"><Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Imprimer</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SalesPage() {
  const { ventes } = useApp();
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
                            <TableCell className="text-right"><SaleDetailsDialog vente={vente} /></TableCell>
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
