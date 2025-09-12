
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Log } from '@/lib/types';
import * as api from '@/lib/api';
import { Search, Loader2, History, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from "react-day-picker";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
              "w-[300px] justify-start text-left font-normal",
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

export default function LogsPage() {
  const { hasPermission } = useApp();
  const { toast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchLogs = useCallback(async () => {
    if (!hasPermission('USER_MANAGE')) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
        const params: { dateDebut?: string, dateFin?: string, searchTerm?: string } = {};
        if(dateRange?.from) params.dateDebut = format(dateRange.from, 'yyyy-MM-dd');
        if(dateRange?.to) params.dateFin = format(dateRange.to, 'yyyy-MM-dd');
        if(searchTerm) params.searchTerm = searchTerm;

        const data = await api.getLogs(params);
        setLogs(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }, [toast, hasPermission, dateRange, searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchLogs();
    }, 300); // Debounce search term
    return () => clearTimeout(handler);
  }, [fetchLogs]);

  if (!hasPermission('USER_MANAGE')) {
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
        <h1 className="font-headline text-3xl font-semibold">Journal des Actions</h1>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><History />Historique des événements</CardTitle>
              <CardDescription>Liste de toutes les actions enregistrées dans le système.</CardDescription>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Chercher par email ou action..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full rounded-lg bg-background pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
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
                            <TableHead>Date & Heure</TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : logs.length > 0 ? logs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">{format(new Date(log.date), 'd MMM yyyy, HH:mm:ss', { locale: fr })}</TableCell>
                            <TableCell><Badge variant="outline">{log.email}</Badge></TableCell>
                            <TableCell className="font-medium">{log.action}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                {searchTerm || dateRange ? "Aucun log ne correspond à vos filtres." : "Aucun log trouvé."}
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
