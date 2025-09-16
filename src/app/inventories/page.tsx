
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import type { Inventaire } from '@/lib/types';
import * as api from '@/lib/api';
import { PlusCircle, ClipboardList, Eye, Loader2, Download, Pencil, AlertCircle, CheckCircle, Search, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-provider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";

function DatePickerWithRange({
  className,
  date,
  setDate,
  disabled
}: React.HTMLAttributes<HTMLDivElement> & { date: DateRange | undefined; setDate: (date: DateRange | undefined) => void; disabled?: boolean; }) {
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
            disabled={disabled}
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

export default function InventoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isMounted, lieuxStock } = useApp();
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [lieuFilter, setLieuFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!isMounted || !currentUser) return;
    setIsLoading(true);
    
    const params = {
        charge: searchTerm || undefined,
        lieuStockId: lieuFilter ? Number(lieuFilter) : undefined,
        dateDebut: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateFin: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        status: undefined,
        avecEcarts: undefined,
    };
    
    try {
      const inventairesData = await api.searchInventaires(params);
      setInventaires(inventairesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [isMounted, currentUser, toast, searchTerm, lieuFilter, dateRange]);

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchData();
    }, 500); // Debounce search
    return () => clearTimeout(handler);
  }, [fetchData]);
  
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

  const isAdmin = useMemo(() => currentUser?.roleNom === 'ADMIN', [currentUser]);

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

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ClipboardList /> Historique des inventaires</CardTitle>
          <CardDescription>Consultez, filtrez et exportez l'historique de tous les inventaires.</CardDescription>
          <div className="flex flex-col md:flex-row items-center gap-2 pt-4">
             <div className="relative w-full md:w-auto md:flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Chercher par nom d'agent..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full rounded-lg bg-background pl-8"
                  />
            </div>
            {isAdmin && (
                <Select value={lieuFilter} onValueChange={(value) => setLieuFilter(value === "all" ? undefined : value)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filtrer par lieu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les lieux</SelectItem>
                        {lieuxStock.map(lieu => <SelectItem key={lieu.id} value={String(lieu.id)}>{lieu.nom}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                {dateRange && (
                    <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
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
                  <TableHead>N° Inventaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Nb. Lignes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : inventaires.length > 0 ? inventaires.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">INV-{String(inv.id).padStart(5, '0')}</TableCell>
                    <TableCell>{format(new Date(inv.date), 'd MMM yyyy à HH:mm', { locale: fr })}</TableCell>
                    <TableCell><Badge variant="outline">{inv.charge}</Badge></TableCell>
                    <TableCell>{inv.lieuStockId ? (lieuxStock.find(l => l.id === inv.lieuStockId)?.nom || `ID:${inv.lieuStockId}`) : 'N/A'}</TableCell>
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
                        {inv.statut === 'EN_ATTENTE_CONFIRMATION' && (
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/inventories/${inv.id}`)}>
                                <Pencil className="h-4 w-4" /><span className="sr-only">Modifier</span>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleExport(inv.id)} disabled={exportingId === inv.id}>
                           {exportingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                           <span className="sr-only">Exporter</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucun inventaire trouvé pour les filtres actuels.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
