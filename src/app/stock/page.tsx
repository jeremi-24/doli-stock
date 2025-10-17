
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
import { Warehouse, Search, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Stock } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { normalizeString } from "@/lib/utils";

function CorrectionDialog({ 
    stockItem, 
    open, 
    onOpenChange, 
    onConfirm 
}: {
    stockItem: Stock | null,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onConfirm: (produitId: number, lieuStockNom: string, nouvelleQuantite: number) => void
}) {
    const [newQuantity, setNewQuantity] = React.useState<number>(0);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (stockItem) {
            setNewQuantity(stockItem.quantiteTotale || 0);
        }
    }, [stockItem]);

    const handleConfirm = async () => {
        if (!stockItem) return;
        setIsLoading(true);
        try {
            await onConfirm(stockItem.produitId, stockItem.lieuStockNom, newQuantity);
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!stockItem) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Correction de stock pour "{stockItem.produitNom}"</DialogTitle>
                    <DialogDescription>Lieu de stock: {stockItem.lieuStockNom}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Quantité Actuelle</Label>
                        <div className="p-2 border rounded-md bg-muted">
                            <p>Cartons: <span className="font-bold">{stockItem.qteCartons}</span></p>
                            <p>Unités: <span className="font-bold">{stockItem.qteUnitesRestantes}</span></p>
                            <p className="font-bold text-lg mt-2">Total: {stockItem.quantiteTotale || 0} Unités</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newQuantity">Nouvelle Quantité Totale (en unités)</Label>
                        <Input
                            id="newQuantity"
                            type="number"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(Number(e.target.value))}
                            className="text-lg font-bold"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer la Correction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StockPageContent() {
    const { currentUser, isMounted, lieuxStock, corrigerStock, hasPermission } = useApp();
    const [stocks, setStocks] = React.useState<Stock[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const lieuParam = searchParams.get('lieu');
    
    const [selectedLieu, setSelectedLieu] = React.useState<string>(lieuParam || "all");
    const [correctingStock, setCorrectingStock] = React.useState<Stock | null>(null);
    const { toast } = useToast();

    const fetchStocks = React.useCallback(async () => {
        if (!currentUser) return;

        setIsLoading(true);
        try {
            let data: Stock[] = [];
            const canViewAll = hasPermission('ALL_STOCK_READ');

            if (!canViewAll) {
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
    }, [currentUser, toast, hasPermission]);

    React.useEffect(() => {
        if (isMounted && currentUser) {
            fetchStocks();
        }
    }, [isMounted, currentUser, fetchStocks]);

    const handleCorrection = async (produitId: number, lieuStockNom: string, nouvelleQuantite: number) => {
        await corrigerStock(produitId, lieuStockNom, nouvelleQuantite);
        setCorrectingStock(null);
        await fetchStocks(); // Re-fetch to get updated stock
    };

    const filteredStocks = React.useMemo(() => {
        const normalizedSearch = normalizeString(searchTerm);

        return stocks.filter(item => {
            const matchesLieu = selectedLieu === 'all' || item.lieuStockNom === selectedLieu;
            
            const searchableString = normalizeString(
                `${item.produitNom} ${item.produitRef} ${item.lieuStockNom}`
            );
            
            const matchesSearch = normalizedSearch === '' || searchableString.includes(searchableString);
            
            return matchesLieu && matchesSearch;
        });
    }, [searchTerm, stocks, selectedLieu]);

    const pageTitle = React.useMemo(() => {
        if (selectedLieu === 'all') {
            return "État du Stock";
        }
        return `État du Stock - ${selectedLieu}`;
    }, [selectedLieu]);
    
    const canViewAllLieux = React.useMemo(() => hasPermission('ALL_STOCK_READ'), [hasPermission]);
    const canCorrectStock = React.useMemo(() => hasPermission('INVENTAIRE_MANAGE'), [hasPermission]);

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
                            className="pl-8 w-[300px] border border-black rounded-md focus:border focus:border-transparent"
                            />
                    </div>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Warehouse /> Vue d'ensemble des stocks ({filteredStocks.length})
                        </CardTitle>
                        {isMounted && canViewAllLieux && (
                            <Select value={selectedLieu} onValueChange={setSelectedLieu}>
                                <SelectTrigger className="w-[180px]">
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
                                    <TableHead className="text-right">Quantité totale (U)</TableHead>
                                    {canCorrectStock && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={canCorrectStock ? 7 : 6} className="h-24 text-center">
                                            <Loader2 className="animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStocks.length > 0 ? (
                                    filteredStocks.map((stockItem) => (
                                        <TableRow key={stockItem.id}>
                                            <TableCell className="font-medium">
                                                <span 
                                                    className="cursor-pointer underline "
                                                    onClick={() => router.push(`/products/${stockItem.produitId}`)}
                                                >
                                                    {stockItem.produitNom}
                                                </span>
                                            </TableCell>
                                            <TableCell>{stockItem.produitRef}</TableCell>
                                            <TableCell>{stockItem.lieuStockNom}</TableCell>
                                            <TableCell className="text-right font-bold">{stockItem.qteCartons}</TableCell>
                                            <TableCell className="text-right font-bold">{stockItem.qteUnitesRestantes}</TableCell>
                                            <TableCell className="text-right font-extrabold">{stockItem.quantiteTotale}</TableCell>
                                            {canCorrectStock && (
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => setCorrectingStock(stockItem)}>
                                                        <Pencil className="h-3 w-3 mr-2"/>
                                                        Corriger
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={canCorrectStock ? 7 : 6} className="h-24 text-center">
                                            Aucun stock trouvé pour les critères sélectionnés.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <CorrectionDialog
                stockItem={correctingStock}
                open={!!correctingStock}
                onOpenChange={(open) => !open && setCorrectingStock(null)}
                onConfirm={handleCorrection}
            />
        </div>
    );
}

export default function StockPage() {
    return (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <StockPageContent />
        </React.Suspense>
    );
}
