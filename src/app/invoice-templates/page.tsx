
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { FileSignature, PlusCircle, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import type { FactureModele } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import * as api from '@/lib/api';

const colorRegex = /^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/;
const colorSchema = z.string().regex(colorRegex, "Format invalide. Utilisez 'H S% L%'").optional().or(z.literal(''));

const modeleSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  logoUrl: z.string().url({ message: "Veuillez entrer une URL valide pour le logo." }).optional().or(z.literal('')),
  header: z.string().optional(),
  footer: z.string().optional(),
  color: colorSchema,
});

function InvoicePreview({ logoUrl, header, footer, color }: Partial<Omit<FactureModele, 'id' | 'nom'>>) {
  const primaryColorStyle = color ? { color: `hsl(${color})` } : {};

  return (
    <div className="bg-white p-6 rounded-md shadow-sm border aspect-[210/297] scale-95 origin-top mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto max-w-[150px] object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x50.png'; e.currentTarget.alt = 'Logo invalide'; }} />
          ) : (
            <h2 className="text-xl font-bold" style={primaryColorStyle}>Votre Logo</h2>
          )}
          <p className="text-xs text-gray-500 mt-1">Votre Adresse, Ville</p>
          <p className="text-xs text-gray-500">Votre Téléphone</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold" style={primaryColorStyle}>
            {header || 'FACTURE'}
          </h1>
          <p className="text-xs text-gray-500">N° : FACT-001</p>
          <p className="text-xs text-gray-500">Date : 01/01/2024</p>
        </div>
      </div>
      {/* Client Info */}
      <div className="mb-8">
        <p className="text-xs text-gray-500">Facturé à :</p>
        <p className="font-semibold text-sm">Nom du Client</p>
      </div>
      {/* Table */}
      <div className="text-xs">
          <div className="flex bg-gray-50 p-2 font-bold rounded-t-md"><div className="flex-1">Produit / Service</div><div className="w-12 text-center">Qté</div><div className="w-20 text-right">P.U.</div><div className="w-20 text-right">Total</div></div>
          <div className="flex p-2 border-b"><div className="flex-1">Exemple de produit A</div><div className="w-12 text-center">2</div><div className="w-20 text-right">1 000</div><div className="w-20 text-right">2 000</div></div>
          <div className="flex p-2 border-b"><div className="flex-1">Exemple de service B</div><div className="w-12 text-center">1</div><div className="w-20 text-right">5 000</div><div className="w-20 text-right">5 000</div></div>
          <div className="flex p-2 mt-4 font-bold justify-end text-sm"><div className="w-20 text-right text-gray-500">Total :</div><div className="w-20 text-right">7 000</div></div>
      </div>
       {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500 absolute bottom-6 inset-x-6">
        <p>{footer || 'Merci de votre confiance et à bientôt !'}</p>
      </div>
    </div>
  )
}

export default function InvoiceTemplatesPage() {
    const { toast } = useToast();
    const { factureModeles, addFactureModele, updateFactureModele, deleteFactureModele } = useApp();
    const [isMounted, setIsMounted] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingModele, setEditingModele] = useState<FactureModele | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof modeleSchema>>({
        resolver: zodResolver(modeleSchema),
        defaultValues: { nom: "", logoUrl: "", header: "", footer: "", color: "" },
    });
    
    const watchedValues = form.watch();

    useEffect(() => {
        // fetchModeles();
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isDialogOpen) {
            if (editingModele) {
                form.reset({
                    nom: editingModele.nom || "",
                    logoUrl: editingModele.logoUrl || "",
                    header: editingModele.header || "",
                    footer: editingModele.footer || "",
                    color: editingModele.color || "",
                });
            } else {
                form.reset({ nom: "", logoUrl: "", header: "", footer: "", color: "" });
            }
        }
    }, [editingModele, form, isDialogOpen]);

    const handleAddNew = () => {
        setEditingModele(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (modele: FactureModele) => {
        setEditingModele(modele);
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof modeleSchema>) => {
        setIsLoading(true);
        try {
            if (editingModele) {
                // await updateFactureModele({ ...editingModele, ...values });
                toast({ title: "Modèle mis à jour" });
            } else {
                // await addFactureModele(values);
                toast({ title: "Modèle ajouté" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
            toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (modeleId: string) => {
        setIsLoading(true);
        try {
            // await deleteFactureModele(modeleId);
            toast({ title: "Modèle supprimé" });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
            toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Modèles de Facture</h1>
                <div className="ml-auto">
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Créer un modèle
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileSignature /> Vos Modèles</CardTitle>
                    <CardDescription>Gérez les modèles réutilisables pour la mise en page de vos factures.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Modèle</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : factureModeles.length > 0 ? (
                                    factureModeles.map((modele) => (
                                        <TableRow key={modele.id}>
                                            <TableCell className="font-medium">{modele.nom}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(modele)}>
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
                                                                        Cette action est irréversible. Elle supprimera définitivement le modèle "{modele.nom}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(modele.id)} disabled={isLoading}>
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
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            Aucun modèle trouvé. Commencez par en créer un.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingModele ? "Modifier le Modèle" : "Nouveau Modèle de Facture"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 grid md:grid-cols-2 gap-8 overflow-hidden">
                      <div className="flex flex-col">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-4 flex-1">
                                <FormField control={form.control} name="nom" render={({ field }) => (
                                    <FormItem><FormLabel>Nom du modèle</FormLabel><FormControl><Input placeholder="ex: Facture Proforma" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="logoUrl" render={({ field }) => (
                                    <FormItem><FormLabel>URL du logo</FormLabel><FormControl><Input placeholder="https://votresite.com/logo.png" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="header" render={({ field }) => (
                                    <FormItem><FormLabel>Entête</FormLabel><FormControl><Input placeholder="ex: FACTURE" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="footer" render={({ field }) => (
                                    <FormItem><FormLabel>Pied de page</FormLabel><FormControl><Textarea placeholder="ex: Conditions de paiement..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="color" render={({ field }) => (
                                    <FormItem><FormLabel>Couleur</FormLabel><FormControl><Input placeholder="ex: 231 48% 48%" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Entrez une couleur au format HSL (ex: 231 48% 48%).</FormDescription><FormMessage /></FormItem>
                                )}/>
                            </form>
                        </Form>
                        <DialogFooter className="mt-auto pt-4 border-t">
                            <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading ? "Sauvegarde..." : (editingModele ? "Sauvegarder" : "Créer")}
                            </Button>
                        </DialogFooter>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 justify-center">
                            <Eye className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg text-center text-muted-foreground">Aperçu en direct</h3>
                        </div>
                        <InvoicePreview {...watchedValues} />
                      </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
    

    