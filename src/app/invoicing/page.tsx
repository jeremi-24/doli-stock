
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Facture } from '@/lib/types';
import * as api from '@/lib/api';
import { Eye, Search, FileText, Loader2, Trash2, FileWarning, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-provider';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function DatePickerWithRange({
  className,
  date,
  setDate,
}: React.HTMLAttributes<HTMLDivElement> & { date: DateRange | undefined; setDate: (date: DateRange | undefined) => void; }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d MMM yy", { locale: fr })} -{" "}
                  {format(date.to, "d MMM yy", { locale: fr })}
                </>
              ) : (
                format(date.from, "d MMM yy", { locale: fr })
              )
            ) : (
              <span>Filtrer par période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function InvoicesPage() {
  const { deleteFacture, hasPermission, clients, isMounted } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  
  const fetchAllFactures = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await api.getFactures();
        setFactures(data || []);
    } catch (error) {
        toast({ variant: "destructive", title: "Erreur de chargement", description: "Impossible de charger la liste complète des factures." });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isMounted) {
      fetchAllFactures();
    }
  }, [isMounted, fetchAllFactures]);

  const handleFilterChange = useCallback(async () => {
    const hasFilters = dateRange?.from || selectedClientId;
    if (!hasFilters) {
        fetchAllFactures();
        return;
    }
    
    setIsLoading(true);
    try {
        const params = {
            dateDebut: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
            dateFin: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            clientId: selectedClientId ? Number(selectedClientId) : undefined,
        };
        const data = await api.searchFactures(params);
        setFactures(data || []);
    } catch (error) {
        toast({ variant: "destructive", title: "Erreur de recherche", description: "Impossible d'appliquer les filtres." });
    } finally {
        setIsLoading(false);
    }
  }, [dateRange, selectedClientId, fetchAllFactures, toast]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      handleFilterChange();
    }, 500);
    return () => clearTimeout(handler);
  }, [dateRange, selectedClientId, handleFilterChange]);

  const filteredFacturesBySearchTerm = useMemo(() => {
    if (!searchTerm) return factures;
    return factures.filter(facture => 
          (facture.clientNom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (String(facture.idFacture) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (String(facture.commandeId) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [factures, searchTerm]);
  
  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    await deleteFacture(id);
    setIsDeleting(null);
    await fetchAllFactures();
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

  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedClientId(undefined);
    setSearchTerm("");
    fetchAllFactures();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold">Liste des Factures</h1>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><FileText />Toutes les factures</CardTitle>
              <CardDescription>Consultez et filtrez toutes les factures générées.</CardDescription>
              <div className="flex flex-col md:flex-row items-center gap-2 pt-4">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Chercher par N°, client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-background pl-8"/>
                </div>
                 <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filtrer par client" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les clients</SelectItem>
                        {clients.map(client => <SelectItem key={client.id} value={String(client.id)}>{client.nom}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    {(dateRange || selectedClientId) && (
                        <Button variant="ghost" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              </div>
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
                    ) : filteredFacturesBySearchTerm.length > 0 ? filteredFacturesBySearchTerm.map(facture => {
                        return (
                        <TableRow key={facture.idFacture}>
                            <TableCell className="font-mono text-xs">FACT-{String(facture.idFacture).padStart(5, '0')}</TableCell>
                            <TableCell>{facture.dateFacture ? format(new Date(facture.dateFacture), 'd MMM yyyy HH:mm', { locale: fr }) : "N/A"}</TableCell>
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
                    )}) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Aucune facture ne correspond à votre recherche." : "Aucune facture trouvée pour les filtres actuels."}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
