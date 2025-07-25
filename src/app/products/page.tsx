
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
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/app-provider";
import { Package, Search, Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Produit, Categorie, LieuStock } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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


export default function ProductsPage() {
    const { produits, categories, lieuxStock, addProduit, updateProduit, deleteProduits, isMounted, hasPermission } = useApp();
    const { toast } = useToast();
    const [filteredProduits, setFilteredProduits] = React.useState<Produit[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingProduit, setEditingProduit] = React.useState<Produit | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedProduits, setSelectedProduits] = React.useState<number[]>([]);

    const form = useForm<z.infer<typeof produitSchema>>({
        resolver: zodResolver(produitSchema),
        defaultValues: { nom: "", ref: "", prix: 0, qteMin: 0, qteParCarton: 0, prixCarton: 0 },
    });

    React.useEffect(() => {
        setFilteredProduits(produits);
    }, [produits]);

    React.useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = produits.filter(item => {
            return (
                item.nom.toLowerCase().includes(lowercasedFilter) ||
                (item.ref && item.ref.toLowerCase().includes(lowercasedFilter)) ||
                (item.categorieNom && item.categorieNom.toLowerCase().includes(lowercasedFilter))
            );
        });
        setFilteredProduits(filteredData);
    }, [searchTerm, produits]);

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
        setIsDialogOpen(true);
    };

    const handleEdit = (produit: Produit) => {
        setEditingProduit(produit);
        setIsDialogOpen(true);
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
            setIsDialogOpen(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteSelected = async () => {
        setIsLoading(true);
        try {
            await deleteProduits(selectedProduits);
            toast({ title: "Produits supprimés" });
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
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:w-[300px]"
                        />
                    </div>
                     {canCreate && (
                        <Button size="sm" onClick={handleAddNew}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un produit
                        </Button>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Package /> Catalogue Produits ({filteredProduits.length})
                    </CardTitle>
                    <CardDescription>
                        Liste de tous les produits de votre catalogue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Produit</TableHead>
                                    <TableHead>Référence</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead>Lieu de Stock</TableHead>
                                    <TableHead className="text-right">Prix (Unité)</TableHead>
                                    <TableHead className="text-right">Qté/Carton</TableHead>
                                    <TableHead className="text-right">Prix (Carton)</TableHead>
                                    <TableHead className="text-right">Stock Total</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <Loader2 className="animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProduits.length > 0 ? (
                                    filteredProduits.map((produit) => (
                                        <TableRow key={produit.id}>
                                            <TableCell className="font-medium">{produit.nom}</TableCell>
                                            <TableCell>{produit.ref}</TableCell>
                                            <TableCell>{produit.categorieNom}</TableCell>
                                            <TableCell>{produit.lieuStockNom}</TableCell>
                                            <TableCell className="text-right">{produit.prix.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{produit.qteParCarton}</TableCell>
                                            <TableCell className="text-right">{produit.prixCarton.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold">{produit.qte}</TableCell>
                                            <TableCell className="text-right">
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
                                                                <AlertDialogAction onClick={() => handleDeleteSelected()} disabled={isLoading}>
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
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            {searchTerm ? "Aucun produit ne correspond à votre recherche." : "Aucun produit trouvé."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                <FormItem><FormLabel>Référence</FormLabel><FormControl><Input placeholder="ex: HUILE-01" {...field} /></FormControl><FormMessage /></FormItem>
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
        </div>
    );
}

