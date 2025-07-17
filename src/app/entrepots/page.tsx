

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { LieuStock } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

const lieuStockSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  type: z.string().min(2, "Le type doit contenir au moins 2 caractères."),
  localisation: z.string().optional(),
});

export default function LieuxStockPage() {
    const { lieuxStock, addLieuStock, updateLieuStock, deleteLieuxStock, isMounted } = useApp();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLieuStock, setEditingLieuStock] = useState<LieuStock | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLieux, setSelectedLieux] = useState<number[]>([]);

    const form = useForm<z.infer<typeof lieuStockSchema>>({
        resolver: zodResolver(lieuStockSchema),
        defaultValues: { nom: "", type: "", localisation: "" },
    });

    useEffect(() => {
        if (editingLieuStock) {
            form.reset({ nom: editingLieuStock.nom, type: editingLieuStock.type, localisation: editingLieuStock.localisation || "" });
        } else {
            form.reset({ nom: "", type: "", localisation: "" });
        }
    }, [editingLieuStock, form]);

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
          setSelectedLieux(lieuxStock.map((e) => e.id));
        } else {
          setSelectedLieux([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedLieux((prev) => [...prev, id]);
        } else {
            setSelectedLieux((prev) => prev.filter((eId) => eId !== id));
        }
    };

    const handleAddNew = () => {
        setEditingLieuStock(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (lieu: LieuStock) => {
        setEditingLieuStock(lieu);
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof lieuStockSchema>) => {
        setIsLoading(true);
        try {
            if (editingLieuStock) {
                await updateLieuStock(editingLieuStock.id, values);
                toast({ title: "Lieu de stock mis à jour" });
            } else {
                await addLieuStock(values);
                toast({ title: "Lieu de stock ajouté" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        setIsLoading(true);
        try {
            await deleteLieuxStock(selectedLieux);
            toast({ title: "Lieux de stock supprimés" });
            setSelectedLieux([]);
        } catch (error) {
            // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Gestion des Lieux de Stock</h1>
                <div className="ml-auto flex items-center gap-2">
                    {selectedLieux.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Supprimer ({selectedLieux.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Elle supprimera définitivement {selectedLieux.length} lieu(x) de stock.
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
                        Ajouter un lieu
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Building2 /> Vos Lieux de Stock</CardTitle>
                    <CardDescription>Gérez les magasins et boutiques où vos produits sont stockés.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedLieux.length === lieuxStock.length && lieuxStock.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Localisation</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : lieuxStock.length > 0 ? (
                                    lieuxStock.map((lieu) => (
                                        <TableRow key={lieu.id} data-state={selectedLieux.includes(lieu.id) ? "selected" : undefined}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedLieux.includes(lieu.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(lieu.id, !!checked)}
                                                    aria-label={`Select lieu ${lieu.nom}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{lieu.nom}</TableCell>
                                            <TableCell>{lieu.type}</TableCell>
                                            <TableCell>{lieu.localisation}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(lieu)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Aucun lieu de stock trouvé. Commencez par en ajouter un.
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
                        <DialogTitle className="font-headline">{editingLieuStock ? "Modifier le Lieu" : "Ajouter un Lieu"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: Magasin HED" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: Magasin, Boutique" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="localisation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Localisation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: Adétikopé" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingLieuStock ? "Sauvegarder" : "Créer")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
