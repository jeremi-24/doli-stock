

"use client";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import { Warehouse, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Stock } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as api from "@/lib/api";

export default function StockPage() {
    const { hasPermission } = useApp();
    const [stocks, setStocks] = React.useState<Stock[]>([]);
    const [filteredStocks, setFilteredStocks] = React.useState<Stock[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchStocks() {
            try {
                setIsLoading(true);
                const data = await api.getStocks();
                setStocks(data || []);
                setFilteredStocks(data || []);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStocks();
    }, [toast]);

    React.useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = stocks.filter(item => {
            return (
                item.produitNom.toLowerCase().includes(lowercasedFilter) ||
                item.lieuStockNom.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredStocks(filteredData);
    }, [searchTerm, stocks]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-semibold">État du Stock</h1>
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:w-[300px]"
                        />
                    </div>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Warehouse /> Vue d'ensemble des stocks ({filteredStocks.length})
                    </CardTitle>
                    <CardDescription>
                        Consultez la quantité de chaque produit dans les différents lieux de stock.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead>Lieu de Stock</TableHead>
                                    <TableHead className="text-right">Nombre de Cartons</TableHead>
                                    <TableHead className="text-right">Unité hors Cartons</TableHead>
                                    <TableHead className="text-right font-semibold">Stock Total (en Unités)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStocks.length > 0 ? (
                                    filteredStocks.map((stockItem) => (
                                        <TableRow key={stockItem.id}>
                                            <TableCell className="font-medium">{stockItem.produitNom}</TableCell>
                                            <TableCell>{stockItem.lieuStockNom}</TableCell>
                                            <TableCell className="text-right">{stockItem.qteCartons}</TableCell>
                                            <TableCell className="text-right">{stockItem.qteUnitesRestantes}</TableCell>
                                            <TableCell className="text-right font-semibold">{stockItem.quantiteTotale}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Aucun stock trouvé.
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
