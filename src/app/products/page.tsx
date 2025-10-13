
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/app-provider";
import { Package, Search, Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2, SlidersHorizontal, Hand, Tag, Building2, DollarSign, Boxes, AlertTriangle, Hash, Printer } from "lucide-react";
import type { Produit, Categorie, LieuStock, AssignationPayload } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm, useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import * as api from "@/lib/api";
import { Label } from "@/components/ui/label";

const produitSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    ref: z.string().optional(),
    prix: z.coerce.number().min(0, "Le prix doit être positif."),
    qteMin: z.coerce.number().int().min(0, "Le seuil doit être un entier positif."),
    categorieId: z.coerce.number({ invalid_type_error: "Veuillez sélectionner une catégorie." }).gt(0, "Veuillez sélectionner une catégorie."),
    qteParCarton: z.coerce.number().int().min(0, "La quantité doit être un entier positif."),
    prixCarton: z.coerce.number().min(0, "Le prix doit être positif."),
});

const assignationSchema = z.object({
    categorieId: z.coerce.number().optional(),
    lieuStockId: z.coerce.number().optional(),
}).refine(data => data.categorieId || data.lieuStockId, {
    message: "Veuillez sélectionner au moins une catégorie ou un lieu de stock.",
    path: ["categorieId"], 
});


function ProductDetailsDialog({ product, onClose }: { product: Produit | null, onClose: () => void }) {
    if (!product) return null;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    
    const details = [
        { icon: Tag, label: "Catégorie", value: <Badge variant="outline">{product.categorieNom || 'N/A'}</Badge> },
        { icon: DollarSign, label: "Prix Unitaire", value: formatCurrency(product.prix || 0) },
        { icon: DollarSign, label: "Prix Carton", value: formatCurrency(product.prixCarton || 0) },
        { icon: Boxes, label: "Unités par Carton", value: product.qteParCarton || 0 },
        { icon: Package, label: "Stock Total", value: product.quantiteTotaleGlobale ?? 0, className: "font-bold" },
        { icon: AlertTriangle, label: "Seuil d'Alerte", value: product.qteMin || 0 },
    ];

    return (
        <Dialog open={!!product} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{product.nom}</DialogTitle>
                    <DialogDescription>Référence: {product.ref || 'N/A'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 text-sm">
                    {details.map(detail => (
                        <div key={detail.label} className="flex items-center justify-between border-b py-2">
                           <div className="flex items-center gap-2 text-muted-foreground">
                             <detail.icon className="h-4 w-4" />
                             <span>{detail.label}</span>
                           </div>
                           <span className={detail.className}>{detail.value}</span>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AssignationDialog({ 
    open, 
    onOpenChange, 
    selectedProduitIds,
    categories,
    lieuxStock,
    onAssign
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    selectedProduitIds: number[],
    categories: Categorie[],
    lieuxStock: LieuStock[],
    onAssign: (data: AssignationPayload) => Promise<void>
}) {
    const [isAssigning, setIsAssigning] = React.useState(false);
    const form = useHookForm<z.infer<typeof assignationSchema>>({
        resolver: zodResolver(assignationSchema),
    });

    const onSubmit = async (values: z.infer<typeof assignationSchema>) => {
        setIsAssigning(true);
        try {
            await onAssign({ produitIds: selectedProduitIds, ...values });
            onOpenChange(false);
            form.reset();
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Assigner une Catégorie</DialogTitle>
                    <DialogDescription>
                        Appliquez une nouvelle catégorie aux {selectedProduitIds.length} produits sélectionnés.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="categorieId" render={({ field }) => (
                            <FormItem><FormLabel>Nouvelle Catégorie (Optionnel)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Choisir une catégorie..." /></SelectTrigger></FormControl>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}</SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )}/>
                         <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost" disabled={isAssigning}>Annuler</Button></DialogClose>
                            <Button type="submit" disabled={isAssigning}>{isAssigning ? "Assignation..." : "Assigner"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function PrintBarcodeDialog({
    produit,
    open,
    onOpenChange
}: {
    produit: Produit | null,
    open: boolean,
    onOpenChange: (open: boolean) => void
}) {
    const { toast } = useToast();
    const [quantity, setQuantity] = React.useState(1);
    const [isPrinting, setIsPrinting] = React.useState(false);

    React.useEffect(() => {
        if(open) {
            setQuantity(1);
        }
    }, [open]);

    const handlePrint = async () => {
        if (!produit) return;
        setIsPrinting(true);
        try {
            const pdfBlob = await api.printBarcodes({ produitId: produit.id, quantite: quantity });
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `codes-barres-${produit.nom.replace(/ /g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            onOpenChange(false);
            toast({ title: "PDF généré", description: `Le fichier d'étiquettes pour ${produit.nom} est en cours de téléchargement.`});
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
            toast({ variant: "destructive", title: "Erreur d'impression", description: errorMessage });
        } finally {
            setIsPrinting(false);
        }
    };

    if (!produit) return null;

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Imprimer les étiquettes pour "{produit.nom}"</DialogTitle>
                    <DialogDescription>
                        Combien d'étiquettes de code-barres souhaitez-vous imprimer ?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input 
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min="1"
                        className="mt-2"
                        disabled={isPrinting}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" disabled={isPrinting}>Annuler</Button></DialogClose>
                    <Button onClick={handlePrint} disabled={isPrinting || quantity < 1}>
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                        {isPrinting ? "Génération..." : "Imprimer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const COLUMN_NAMES: Record<string, string> = {
    'ref': 'Référence',
    'prix': 'Prix (Unité)',
    'prixCarton': 'Prix (Carton)',
    'quantiteTotaleGlobale': 'Stock Total (U)',
    'qteParCarton': 'Unités/Carton',
    'qteMin': 'Seuil Alerte',
};

export default function ProductsPage() {
    const { produits, categories, lieuxStock, addProduit, updateProduit, deleteProduits, assignProduits, isMounted, hasPermission } = useApp();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");
    
    const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [editingProduit, setEditingProduit] = React.useState<Produit | null>(null);
    const [viewingProduct, setViewingProduct] = React.useState<Produit | null>(null);
    const [printingProduct, setPrintingProduct] = React.useState<Produit | null>(null);
    
    const [isLoading, setIsLoading] = React.useState(false);
    
    const [selectedProduits, setSelectedProduits] = React.useState<number[]>([]);
    
    const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({
        'ref': true,
        'prix': true,
        'prixCarton': false,
        'quantiteTotaleGlobale': true,
        'qteParCarton': false,
        'qteMin': false,
    });

    const form = useForm<z.infer<typeof produitSchema>>({
        resolver: zodResolver(produitSchema),
        defaultValues: { nom: "", ref: "", prix: 0, qteMin: 0, qteParCarton: 0, prixCarton: 0 },
    });
    
    const normalizeString = (str: string | number | undefined | null): string => {
        if (str === null || str === undefined) return '';
        return String(str)
            .toLowerCase()
            .normalize("NFD") 
            .replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-z0-9]/g, ''); 
    };

    const filteredProduits = React.useMemo(() => {
        const normalizedSearch = normalizeString(searchTerm);

        const filtered = produits.filter(item => {
            const searchableString = normalizeString(
                `${item.id} ${item.nom} ${item.ref}`
            );
            
            const matchesSearch = normalizedSearch === '' || searchableString.includes(normalizedSearch);
            const matchesCategory = categoryFilter === 'all' || String(item.categorieId) === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        return filtered.sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''));
    }, [searchTerm, categoryFilter, produits]);


    React.useEffect(() => {
        if (editingProduit) {
            form.reset({
                ...editingProduit,
                ref: editingProduit.ref || "",
            });
        } else {
            form.reset({ nom: "", ref: "", prix: 0, qteMin: 0, categorieId: undefined, qteParCarton: 0, prixCarton: 0 });
        }
    }, [editingProduit, form]);

    const handleAddNew = () => {
        setEditingProduit(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (produit: Produit) => {
        setEditingProduit(produit);
        setIsFormDialogOpen(true);
    };

    const handlePrint = (produit: Produit) => {
        setPrintingProduct(produit);
        setIsPrintDialogOpen(true);
    };
    
    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
          setSelectedProduits(filteredProduits.map((p) => p.id));
        } else {
          setSelectedProduits([]);
        }
    };
    
    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedProduits((prev) => [...prev, id]);
        } else {
            setSelectedProduits((prev) => prev.filter((pId) => pId !== id));
        }
    };

    const onSubmit = async (values: z.infer<typeof produitSchema>) => {
        setIsLoading(true);
        try {
            if (editingProduit) {
                await updateProduit({ ...editingProduit, ...values });
                toast({ title: "Produit mis à jour" });
            } else {
                await addProduit(values);
                toast({ title: "Produit ajouté" });
            }
            setIsFormDialogOpen(false);
            setSelectedProduits([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteSelected = async () => {
        setIsLoading(true);
        try {
            await deleteProduits(selectedProduits);
            toast({ title: "Produit(s) supprimé(s)" });
            setSelectedProduits([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async (data: AssignationPayload) => {
        setIsLoading(true);
        try {
            await assignProduits(data);
            toast({ title: `Assignation réussie pour ${data.produitIds.length} produit(s).`});
            setSelectedProduits([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const canCreate = React.useMemo(() => hasPermission('PRODUIT_CREATE'), [hasPermission]);
    const canUpdate = React.useMemo(() => hasPermission('PRODUIT_UPDATE'), [hasPermission]);
    const canDelete = React.useMemo(() => hasPermission('PRODUIT_DELETE'), [hasPermission]);
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-semibold">Gestion des Produits</h1>
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher par nom/réf..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:w-[250px] border border-black focus:border focus:border-transparent"
                        />
                    </div>
                     {canCreate && (
                        <Button size="sm" onClick={handleAddNew}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
                        </Button>
                    )}
                </div>
            </div>
            {selectedProduits.length > 0 && (
                 <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
                    <span className="text-sm text-muted-foreground font-medium pl-2">{selectedProduits.length} produit(s) sélectionné(s)</span>
                    <div className="ml-auto flex items-center gap-2">
                        {canUpdate && (
                            <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(true)}>
                                <Hand className="h-4 w-4 mr-2"/>
                                Assigner Catégorie
                            </Button>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-2"/>
                                        Supprimer la sélection
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible et supprimera définitivement {selectedProduits.length} produit(s).
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteSelected} disabled={isLoading}>
                                        {isLoading ? "Suppression..." : "Supprimer"}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            )}
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Package /> Liste des Produits ({filteredProduits.length})
                        </CardTitle>
                        <CardDescription>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filtrer par catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les catégories</SelectItem>
                                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Affichage
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Afficher/Masquer</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(columnVisibility).map(([key, value]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        className="capitalize"
                                        checked={value}
                                        onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, [key]: !!checked}))}
                                    >
                                        {COLUMN_NAMES[key] || key}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedProduits.length === filteredProduits.length && filteredProduits.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>id</TableHead>
                                    <TableHead>Nom du Produit</TableHead>
                                    {columnVisibility['ref'] && <TableHead>Référence</TableHead>}
                                    {columnVisibility['prix'] && <TableHead className="text-right">Prix Unitaire</TableHead>}
                                    {columnVisibility['prixCarton'] && <TableHead className="text-right">Prix (Carton)</TableHead>}
                                    {columnVisibility['quantiteTotaleGlobale'] && <TableHead className="text-right">Stock Total (U)</TableHead>}
                                    {columnVisibility['qteParCarton'] && <TableHead className="text-right">U/Carton</TableHead>}
                                    {columnVisibility['qteMin'] && <TableHead className="text-right">Seuil Alerte</TableHead>}
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(columnVisibility).filter(v=>v).length + 3} className="h-24 text-center">
                                            <Loader2 className="animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProduits.length > 0 ? (
                                    filteredProduits.map((produit) => (
                                        <TableRow key={produit.id} data-state={selectedProduits.includes(produit.id) ? "selected" : undefined}>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedProduits.includes(produit.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(produit.id, !!checked)}
                                                    aria-label={`Select product ${produit.nom}`}
                                                />
                                            </TableCell>
                                            <TableCell className=" cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.id}</TableCell>
                                            <TableCell className="font-medium cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.nom}</TableCell>
                                            {columnVisibility['ref'] && <TableCell className="cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.ref}</TableCell>}
                                            {columnVisibility['prix'] && <TableCell className="text-right cursor-pointer" onClick={() => setViewingProduct(produit)}>{(produit.prix || 0).toLocaleString()}</TableCell>}
                                            {columnVisibility['prixCarton'] && <TableCell className="text-right cursor-pointer" onClick={() => setViewingProduct(produit)}>{(produit.prixCarton || 0).toLocaleString()}</TableCell>}
                                            {columnVisibility['quantiteTotaleGlobale'] && <TableCell className="text-right font-bold cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.quantiteTotaleGlobale ?? 0}</TableCell>}
                                            {columnVisibility['qteParCarton'] && <TableCell className="text-right font-bold cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.qteParCarton ?? 0}</TableCell>}
                                            {columnVisibility['qteMin'] && <TableCell className="text-right font-bold cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.qteMin ?? 0}</TableCell>}
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {canUpdate && <DropdownMenuItem onClick={() => handleEdit(produit)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </DropdownMenuItem>}
                                                        <DropdownMenuItem onClick={() => handlePrint(produit)}>
                                                            <Printer className="mr-2 h-4 w-4" /> Imprimer étiquettes
                                                        </DropdownMenuItem>
                                                        {canDelete && <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                 <Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible et supprimera le produit "{produit.nom}".
                                                                </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => deleteProduits([produit.id])} disabled={isLoading}>
                                                                    {isLoading ? "Suppression..." : "Supprimer"}
                                                                </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(columnVisibility).filter(v=>v).length + 3} className="h-24 text-center">
                                            {searchTerm || categoryFilter !== 'all' ? "Aucun produit ne correspond à vos filtres." : "Aucun produit trouvé."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingProduit ? "Modifier le Produit" : "Ajouter un Produit"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 md:grid-cols-2">
                            <FormField control={form.control} name="nom" render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Nom du produit</FormLabel><FormControl><Input placeholder="ex: Huile Moteur 5L" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="ref" render={({ field }) => (
                                <FormItem><FormLabel>Référence</FormLabel><FormControl><Input placeholder="ex: HUILE-01" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="prix" render={({ field }) => (
                                <FormItem><FormLabel>Prix de vente (unité)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="qteMin" render={({ field }) => (
                                <FormItem><FormLabel>Seuil d'alerte stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="categorieId" render={({ field }) => (
                                <FormItem><FormLabel>Catégorie</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Choisir une catégorie..." /></SelectTrigger></FormControl>
                                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}</SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="qteParCarton" render={({ field }) => (
                                <FormItem><FormLabel>Unités par Carton</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="prixCarton" render={({ field }) => (
                                <FormItem><FormLabel>Prix de vente (carton)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <DialogFooter className="md:col-span-2">
                                <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingProduit ? "Sauvegarder" : "Créer")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <ProductDetailsDialog product={viewingProduct} onClose={() => setViewingProduct(null)} />
             <AssignationDialog 
                open={isAssignDialogOpen} 
                onOpenChange={setIsAssignDialogOpen} 
                selectedProduitIds={selectedProduits}
                categories={categories}
                lieuxStock={lieuxStock}
                onAssign={handleAssign}
            />
             <PrintBarcodeDialog
                produit={printingProduct}
                open={isPrintDialogOpen}
                onOpenChange={setIsPrintDialogOpen}
            />
        </div>
    );
}

    
