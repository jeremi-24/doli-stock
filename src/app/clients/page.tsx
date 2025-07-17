
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
import { Users, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const clientSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  tel: z.string().optional(),
});

export default function ClientsPage() {
    const { clients, addClient, updateClient, deleteClient, isMounted } = useApp();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: { nom: "", tel: "" },
    });

    useEffect(() => {
        if (editingClient) {
            form.reset({ nom: editingClient.nom, tel: editingClient.tel || "" });
        } else {
            form.reset({ nom: "", tel: "" });
        }
    }, [editingClient, form]);


    const handleAddNew = () => {
        setEditingClient(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof clientSchema>) => {
        setIsLoading(true);
        try {
            if (editingClient) {
                await updateClient(editingClient.id, values);
                toast({ title: "Client mis à jour" });
            } else {
                await addClient(values);
                toast({ title: "Client ajouté" });
            }
            setIsDialogOpen(false);
        } catch (error) {
             // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (clientId: number) => {
        setIsLoading(true);
        try {
            await deleteClient(clientId);
            // Success toast is handled in context
        } catch (error) {
           // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Gestion des Clients</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter un client
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users /> Vos Clients</CardTitle>
                    <CardDescription>Gérez la liste de vos clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Client</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : clients.length > 0 ? (
                                    clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.nom}</TableCell>
                                            <TableCell>{client.tel}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </DropdownMenuItem>
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
                                                                    Cette action est irréversible et supprimera le client "{client.nom}".
                                                                </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(client.id)} disabled={isLoading}>
                                                                    {isLoading ? "Suppression..." : "Supprimer"}
                                                                </AlertDialogAction>
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
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            Aucun client trouvé. Commencez par en ajouter un.
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
                        <DialogTitle className="font-headline">{editingClient ? "Modifier le Client" : "Ajouter un Client"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom du client</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: John Doe" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="tel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: +228 90000000" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingClient ? "Sauvegarder" : "Créer")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
