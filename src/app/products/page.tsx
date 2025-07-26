
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
import { Package, Search, Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2, SlidersHorizontal, Settings2, Hand } from "lucide-react";
import type { Produit, Categorie, LieuStock, AssignationPayload } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm, useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const produitSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    ref: z.string().optional(),
    prix: z.coerce.number().min(0, "Le prix doit être positif."),
    qteMin: z.coerce.number().int().min(0, "Le seuil doit être un entier positif."),
    categorieId: z.coerce.number({ invalid_type_error: "Veuillez sélectionner une catégorie." }).gt(0, "Veuillez sélectionner une catégorie."),
    lieuStockId: z.coerce.number({ invalid_type_error: "Veuillez sélectionner un lieu." }).gt(0, "Veuillez sélectionner un lieu."),
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
    
    return (
        <Dialog open={!!product} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{product.nom}</DialogTitle>
                    <DialogDescription>Référence: {product.ref || 'N/A'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Catégorie</span><Badge variant="outline">{product.categorieNom || 'N/A'}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Lieu de Stock</span><Badge variant="outline">{product.lieuStockNom || 'N/A'}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Prix Unitaire</span><span>{formatCurrency(product.prix)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Prix Carton</span><span>{formatCurrency(product.prixCarton)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Unités par Carton</span><span>{product.qteParCarton}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Quantité en Stock</span><span className="font-bold">{product.qte}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Seuil d'Alerte</span><span>{product.qteMin}</span></div>
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
                    <DialogTitle className="font-headline">Assigner une Catégorie / un Lieu</DialogTitle>
                    <DialogDescription>
                        Appliquez une nouvelle catégorie et/ou un nouveau lieu de stock aux {selectedProduitIds.length} produits sélectionnés.
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
                        <FormField control={form.control} name="lieuStockId" render={({ field }) => (
                            <FormItem><FormLabel>Nouveau Lieu de Stock (Optionnel)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Choisir un lieu..." /></SelectTrigger></FormControl>
                                    <SelectContent>{lieuxStock.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}</SelectContent>
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

const COLUMN_NAMES: Record<string, string> = {
    'ref': 'Référence',
    'prix': 'Prix (Unité)',
    'prixCarton': 'Prix (Carton)',
    'qte': 'Stock Total (U)',
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
    const [editingProduit, setEditingProduit] = React.useState<Produit | null>(null);
    const [viewingProduct, setViewingProduct] = React.useState<Produit | null>(null);
    
    const [isLoading, setIsLoading] = React.useState(false);
    
    const [selectedProduits, setSelectedProduits] = React.useState<number[]>([]);
    
    const [columnVisibility, setColumnVisibility] = React.useState({
        'ref': true,
        'prix': true,
        'prixCarton': false,
        'qte': true,
        'qteParCarton': false,
        'qteMin': false,
    });

    const form = useForm<z.infer<typeof produitSchema>>({
        resolver: zodResolver(produitSchema),
        defaultValues: { nom: "", ref: "", prix: 0, qteMin: 0, qteParCarton: 0, prixCarton: 0 },
    });
    
    const filteredProduits = React.useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return produits.filter(item => {
            const matchesSearch = item.nom.toLowerCase().includes(lowercasedFilter) || (item.ref && item.ref.toLowerCase().includes(lowercasedFilter));
            const matchesCategory = categoryFilter === 'all' || String(item.categorieId) === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, categoryFilter, produits]);


    React.useEffect(() => {
        if (editingProduit) {
            form.reset({
                ...editingProduit,
                ref: editingProduit.ref || "",
            });
        } else {
            form.reset({ nom: "", ref: "", prix: 0, qteMin: 0, categorieId: undefined, lieuStockId: undefined, qteParCarton: 0, prixCarton: 0 });
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
                            className="pl-8 sm:w-[250px]"
                        />
                    </div>
                     <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrer par catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
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
                                Assigner Cat./Lieu
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
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Package /> Catalogue Produits ({filteredProduits.length})
                    </CardTitle>
                    <CardDescription>
                        Liste de tous les produits de votre catalogue. Cliquez sur une ligne pour voir les détails.
                    </CardDescription>
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
                                    <TableHead>Nom du Produit</TableHead>
                                    {columnVisibility['ref'] && <TableHead>Référence</TableHead>}
                                    {columnVisibility['prix'] && <TableHead className="text-right">Prix (Unité)</TableHead>}
                                    {columnVisibility['prixCarton'] && <TableHead className="text-right">Prix (Carton)</TableHead>}
                                    {columnVisibility['qte'] && <TableHead className="text-right">Stock Total (U)</TableHead>}
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
                                            <TableCell className="font-medium cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.nom}</TableCell>
                                            {columnVisibility['ref'] && <TableCell className="cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.ref}</TableCell>}
                                            {columnVisibility['prix'] && <TableCell className="text-right cursor-pointer" onClick={() => setViewingProduct(produit)}>{(produit.prix || 0).toLocaleString()}</TableCell>}
                                            {columnVisibility['prixCarton'] && <TableCell className="text-right cursor-pointer" onClick={() => setViewingProduct(produit)}>{(produit.prixCarton || 0).toLocaleString()}</TableCell>}
                                            {columnVisibility['qte'] && <TableCell className="text-right font-bold cursor-pointer" onClick={() => setViewingProduct(produit)}>{produit.qte ?? 0}</TableCell>}
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
                            <FormField control={form.control} name="lieuStockId" render={({ field }) => (
                                <FormItem><FormLabel>Lieu de stock principal</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Choisir un lieu..." /></SelectTrigger></FormControl>
                                        <SelectContent>{lieuxStock.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}</SelectContent>
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
        </div>
    );
}
