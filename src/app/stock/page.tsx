

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";


export default function StockPage() {
    const { currentUser, isMounted, lieuxStock } = useApp();
    const [stocks, setStocks] = React.useState<Stock[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const searchParams = useSearchParams();
    const lieuParam = searchParams.get('lieu');
    
    const [selectedLieu, setSelectedLieu] = React.useState<string>(lieuParam || "all");
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchStocks = async () => {
            if (!currentUser) return;

            setIsLoading(true);
            try {
                let data: Stock[] = [];
                const isAdminUser = currentUser.roleNom === 'ADMIN';

                if (!isAdminUser) {
                    if (currentUser.lieuNom) {
                        data = await api.getStocksByLieuNom(currentUser.lieuNom);
                    } else {
                        toast({ variant: 'destructive', title: 'Configuration manquante', description: 'Aucun lieu de stock n\'est assigné à votre compte.' });
                    }
                } else {
                    data = await api.getStocks();
                }
                
                setStocks(data || []);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                toast({ variant: 'destructive', title: 'Erreur de chargement', description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        };
        
        if (isMounted && currentUser) {
          fetchStocks();
        }
    }, [isMounted, currentUser, toast]);

    const filteredStocks = React.useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        return stocks.filter(item => {
            // Filtrer par nom de lieu au lieu de l'ID
            const matchesLieu = selectedLieu === 'all' || item.lieuStockNom === selectedLieu;
            
            const matchesSearch = item.produitNom.toLowerCase().includes(lowercasedFilter) ||
                                 (item.produitRef && item.produitRef.toLowerCase().includes(lowercasedFilter)) ||
                                 (item.lieuStockNom && item.lieuStockNom.toLowerCase().includes(lowercasedFilter));
            return matchesLieu && matchesSearch;
        });
    }, [searchTerm, stocks, selectedLieu]);
    const pageTitle = React.useMemo(() => {
        if (selectedLieu === 'all') {
            return "État du Stock";
        }
        return `État du Stock - ${selectedLieu}`;
    }, [selectedLieu]);
    
    const isAdmin = React.useMemo(() => {
        if (!currentUser) return false;
        return currentUser.roleNom === 'ADMIN';
    }, [currentUser]);


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-semibold">{pageTitle}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:w-[200px]"
                        />
                    </div>
                    
                </div>
            </div>
            <Card>
            <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2">
                    <Warehouse /> Vue d'ensemble des stocks ({filteredStocks.length})
                </CardTitle>
                {isMounted && isAdmin && (
                    <Select value={selectedLieu} onValueChange={setSelectedLieu}>
                    <SelectTrigger className="w-[180px] border-black">
                        <SelectValue placeholder="Filtrer par lieu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les lieux</SelectItem>
                        {lieuxStock.map(lieu => (
                            <SelectItem key={lieu.id} value={lieu.nom}>
                                {lieu.nom}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                )}
                </div>
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
                                    <TableHead>Référence</TableHead>
                                    <TableHead>Lieu de Stock</TableHead>
                                    <TableHead className="text-right">Nombre de Cartons</TableHead>
                                    <TableHead className="text-right">Unités hors Cartons</TableHead>
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
                                            <TableCell>{stockItem.produitRef}</TableCell>
                                            <TableCell>{stockItem.lieuStockNom}</TableCell>
                                            <TableCell className="text-right font-bold">{stockItem.qteCartons}</TableCell>
                                            <TableCell className="text-right font-bold">{stockItem.qteUnitesRestantes}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Aucun stock trouvé pour les critères sélectionnés.
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

    