
"use client";

import React, { useState, useEffect } from 'react';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tag, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Categorie } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

const categorieSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
});

export default function CategoriesPage() {
    const { categories, addCategorie, updateCategorie, deleteCategories, isMounted } = useApp();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

    const form = useForm<z.infer<typeof categorieSchema>>({
        resolver: zodResolver(categorieSchema),
        defaultValues: { nom: "" },
    });

    useEffect(() => {
        if (editingCategorie) {
            form.reset({ nom: editingCategorie.nom });
        } else {
            form.reset({ nom: "" });
        }
    }, [editingCategorie, form]);

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
          setSelectedCategories(categories.map((c) => c.id));
        } else {
          setSelectedCategories([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedCategories((prev) => [...prev, id]);
        } else {
            setSelectedCategories((prev) => prev.filter((cId) => cId !== id));
        }
    };

    const handleAddNew = () => {
        setEditingCategorie(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (categorie: Categorie) => {
        setEditingCategorie(categorie);
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof categorieSchema>) => {
        setIsLoading(true);
        try {
            if (editingCategorie) {
                await updateCategorie(editingCategorie.id, values);
                toast({ title: "Catégorie mise à jour" });
            } else {
                await addCategorie(values);
                toast({ title: "Catégorie ajoutée" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        const usedCategories = categories.filter(c => selectedCategories.includes(c.id) && c.nProd && c.nProd > 0);
        if (usedCategories.length > 0) {
            toast({ variant: 'destructive', title: 'Suppression impossible', description: `Les catégories suivantes sont utilisées et ne peuvent pas être supprimées: ${usedCategories.map(c => c.nom).join(', ')}` });
            return;
        }

        setIsLoading(true);
        try {
            await deleteCategories(selectedCategories);
            toast({ title: "Catégories supprimées" });
            setSelectedCategories([]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue lors de la suppression.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Catégories de Produits</h1>
                <div className="ml-auto flex items-center gap-2">
                    {selectedCategories.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Supprimer ({selectedCategories.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Elle supprimera définitivement {selectedCategories.length} catégorie(s).
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
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter une catégorie
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Tag /> Vos Catégories</CardTitle>
                    <CardDescription>Gérez les catégories de vos produits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedCategories.length === categories.length && categories.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Nom de la Catégorie</TableHead>
                                    <TableHead className="text-right">Nombre de produits</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <TableRow key={cat.id} data-state={selectedCategories.includes(cat.id) ? "selected" : undefined}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(cat.id, !!checked)}
                                                    aria-label={`Select category ${cat.nom}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{cat.nom}</TableCell>
                                            <TableCell className="text-right">{cat.nProd ?? 0}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(cat)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Aucune catégorie trouvée. Commencez par en ajouter une.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingCategorie ? "Modifier la Catégorie" : "Ajouter une Catégorie"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de la catégorie</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: Boissons" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingCategorie ? "Sauvegarder" : "Créer")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
