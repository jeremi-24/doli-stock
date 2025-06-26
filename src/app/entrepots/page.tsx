
"use client";

import React, { useState, useEffect } from 'react';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Entrepot } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const entrepotSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  ref: z.string().min(2, "La référence doit contenir au moins 2 caractères."),
});

export default function EntrepotsPage() {
    const { entrepots, addEntrepot, updateEntrepot, deleteEntrepot, isMounted } = useApp();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntrepot, setEditingEntrepot] = useState<Entrepot | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof entrepotSchema>>({
        resolver: zodResolver(entrepotSchema),
        defaultValues: { nom: "", ref: "" },
    });

    useEffect(() => {
        if (editingEntrepot) {
            form.reset({ nom: editingEntrepot.nom, ref: editingEntrepot.ref });
        } else {
            form.reset({ nom: "", ref: "" });
        }
    }, [editingEntrepot, form]);

    const handleAddNew = () => {
        setEditingEntrepot(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (entrepot: Entrepot) => {
        setEditingEntrepot(entrepot);
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof entrepotSchema>) => {
        setIsLoading(true);
        try {
            if (editingEntrepot) {
                await updateEntrepot(editingEntrepot.id, values);
                toast({ title: "Entrepôt mis à jour" });
            } else {
                await addEntrepot(values);
                toast({ title: "Entrepôt ajouté" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (entrepotId: number) => {
        const entrepotToDelete = entrepots.find(e => e.id === entrepotId);
        const isUsed = entrepotToDelete && entrepotToDelete.nbProduits && entrepotToDelete.nbProduits > 0;

        if (isUsed) {
            toast({ variant: 'destructive', title: 'Suppression impossible', description: 'Cet entrepôt est utilisé par au moins un produit.' });
            return;
        }

        setIsLoading(true);
        try {
            await deleteEntrepot(entrepotId);
            toast({ title: "Entrepôt supprimé" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue lors de la suppression.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Gestion des Entrepôts</h1>
                <div className="ml-auto">
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter un entrepôt
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Building2 /> Vos Entrepôts</CardTitle>
                    <CardDescription>Gérez les entrepôts où vos produits sont stockés.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom de l'Entrepôt</TableHead>
                                    <TableHead>Référence</TableHead>
                                    <TableHead className="text-right">Nombre de produits</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : entrepots.length > 0 ? (
                                    entrepots.map((ent) => (
                                        <TableRow key={ent.id}>
                                            <TableCell className="font-medium">{ent.nom}</TableCell>
                                            <TableCell>{ent.ref}</TableCell>
                                            <TableCell className="text-right">{ent.nbProduits ?? 0}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(ent)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Cette action est irréversible. Elle supprimera définitivement l'entrepôt "{ent.nom}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(ent.id)} disabled={isLoading}>{isLoading ? "Suppression..." : "Supprimer"}</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Aucun entrepôt trouvé. Commencez par en ajouter un.
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
                        <DialogTitle className="font-headline">{editingEntrepot ? "Modifier l'Entrepôt" : "Ajouter un Entrepôt"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de l'entrepôt</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: Dépôt Central" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="ref"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Référence</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: DC-01" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingEntrepot ? "Sauvegarder" : "Créer")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
