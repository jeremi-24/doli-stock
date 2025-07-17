
  "use client";
  import * as React from "react";
  import * as z from "zod";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
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
  import { PlusCircle, MoreHorizontal, Pencil, Trash2, AlertCircle, Shuffle, Building2 as Warehouse } from "lucide-react";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
  } from "@/components/ui/dialog";
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
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import type { Produit } from "@/lib/types";
  import { useToast } from "@/hooks/use-toast";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Checkbox } from "@/components/ui/checkbox";

const produitSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  ref: z.string().min(2, "La référence doit contenir au moins 2 caractères."),
  codeBarre: z.string().optional(),
  categorieId: z.string().min(1, "Veuillez sélectionner une catégorie."),
  lieuStockId: z.string().min(1, "Veuillez sélectionner un lieu de stock."),
  prix: z.coerce.number().min(0, "Le prix doit être un nombre positif."),
  qte: z.coerce.number().int().min(0, "La quantité doit être un entier positif."),
  qteMin: z.coerce.number().int().min(0, "L'alerte de stock doit être un entier positif."),
});

const assignSchema = z.object({
    categorieId: z.string().optional(),
    lieuStockId: z.string().optional(),
}).refine(data => !!data.categorieId || !!data.lieuStockId, {
    message: "Veuillez sélectionner au moins une catégorie ou un lieu.",
    path: ["categorieId"], 
});


  export default function StockPage() {
    const { produits, categories, lieuxStock, addProduit, updateProduit, deleteProduits, assignProduits, isMounted } = useApp();
    const [selectedProduits, setSelectedProduits] = React.useState<number[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
    const [editingProduit, setEditingProduit] = React.useState<Produit | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const categoriesMap = React.useMemo(() => new Map(categories.map(c => [c.id, c.nom])), [categories]);
    const lieuxStockMap = React.useMemo(() => new Map(lieuxStock.map(e => [e.id, e.nom])), [lieuxStock]);
    
    const form = useForm<z.infer<typeof produitSchema>>({
      resolver: zodResolver(produitSchema),
      defaultValues: {
        nom: "", ref: "", codeBarre: "", categorieId: "", lieuStockId: "",
        prix: 0, qte: 0, qteMin: 0,
      },
    });

    const assignForm = useForm<z.infer<typeof assignSchema>>({
        resolver: zodResolver(assignSchema),
        defaultValues: { categorieId: "", lieuStockId: "" },
    });

    React.useEffect(() => {
        if (!isAssignDialogOpen) {
            assignForm.reset({ categorieId: "", lieuStockId: "" });
        }
    }, [isAssignDialogOpen, assignForm]);

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
          setSelectedProduits(produits.map((p) => p.id));
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

    const handleAddNew = () => {
      setEditingProduit(null);
      form.reset({
        nom: "", ref: "", codeBarre: `BC-${Date.now().toString().slice(-8)}`,
        categorieId: "", lieuStockId: "",
        prix: 0, qte: 0, qteMin: 0,
      });
      setIsDialogOpen(true);
    };

    const handleEdit = (produit: Produit) => {
        setEditingProduit(produit);
        form.reset({
            nom: produit.nom,
            ref: produit.ref,
            prix: produit.prix,
            qte: produit.qte,
            qteMin: produit.qteMin,
            codeBarre: produit.codeBarre || "",
            categorieId: String(produit.categorieId),
            lieuStockId: String(produit.lieuStockId),
        });
        setIsDialogOpen(true);
    };
    
    const onSubmit = async (values: z.infer<typeof produitSchema>) => {
      setIsLoading(true);
      const productData = { 
          ...values, 
          categorieId: parseInt(values.categorieId, 10),
          lieuStockId: parseInt(values.lieuStockId, 10),
          codeBarre: values.codeBarre || `BC-${Date.now().toString().slice(-8)}`
      };
      
      try {
          if (editingProduit) {
              await updateProduit({ ...editingProduit, ...productData });
              toast({ title: "Produit mis à jour" });
          } else {
              await addProduit(productData);
              toast({ title: "Produit ajouté" });
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
          await deleteProduits(selectedProduits); 
          toast({ title: "Produits supprimés" });
          setSelectedProduits([]);
      } catch (error) {
          // Error is handled in context
      } finally {
          setIsLoading(false);
      }
    };

    const onAssignSubmit = async (values: z.infer<typeof assignSchema>) => {
        setIsLoading(true);
        try {
            const dataToSubmit = {
                produitIds: selectedProduits,
                categorieId: values.categorieId ? parseInt(values.categorieId, 10) : undefined,
                lieuStockId: values.lieuStockId ? parseInt(values.lieuStockId, 10) : undefined,
            };
            
            await assignProduits(dataToSubmit);
            
            toast({ title: "Produits assignés avec succès." });
            setIsAssignDialogOpen(false);
            setSelectedProduits([]);

        } catch (error) {
            // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  const isAllSelected = produits.length > 0 && selectedProduits.length === produits.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Gestion du Stock</h1>
        <div className="ml-auto flex items-center gap-2">
          {selectedProduits.length > 0 && (
            <>
            <Button size="sm" variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                <Shuffle className="h-4 w-4 mr-2"/>
                Assigner ({selectedProduits.length})
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2"/>
                  Supprimer ({selectedProduits.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Elle supprimera définitivement {selectedProduits.length} produit(s).
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
            </>
          )}
          <Button size="sm" onClick={handleAddNew}><PlusCircle className="h-4 w-4 mr-2" />Ajouter un Produit</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Warehouse /> Vos Produits ( {produits.length} )</CardTitle><CardDescription>La liste de tous les produits de votre inventaire.</CardDescription></CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[40px]">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead>Nom</TableHead><TableHead>Catégorie</TableHead><TableHead>Lieu de Stock</TableHead><TableHead>Prix Vente</TableHead><TableHead className="text-right">Quantité</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {!isMounted ? (
                    Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : produits.length > 0 ? (
                  produits.map((produit) => (
                    <TableRow key={produit.id} data-state={selectedProduits.includes(produit.id) ? "selected" : undefined} className={produit.qte <= produit.qteMin ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                      <TableCell>
                        <Checkbox
                            checked={selectedProduits.includes(produit.id)}
                            onCheckedChange={(checked) => handleSelectOne(produit.id, !!checked)}
                            aria-label={`Select produit ${produit.nom}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{produit.nom} {produit.qte <= produit.qteMin && <AlertCircle className="h-4 w-4 inline-block ml-2 text-red-500" />}</TableCell>
                      <TableCell>{categoriesMap.get(produit.categorieId) || 'N/A'}</TableCell>
                      <TableCell>{lieuxStockMap.get(produit.lieuStockId) || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(produit.prix)}</TableCell>
                      <TableCell className="text-right">{produit.qte}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(produit)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : ( <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucun produit trouvé.</TableCell></TableRow> )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedProduits.length} sur {produits.length} produit(s) sélectionné(s). Total: {produits.length} produits.
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingProduit ? "Modifier le Produit" : "Ajouter un Produit"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField control={form.control} name="nom" render={({ field }) => (<FormItem><FormLabel>Nom du produit</FormLabel><FormControl><Input placeholder="T-Shirt" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ref" render={({ field }) => (<FormItem><FormLabel>Référence</FormLabel><FormControl><Input placeholder="REF-001" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="categorieId" render={({ field }) => (
                    <FormItem><FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger></FormControl>
                          <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="lieuStockId" render={({ field }) => (
                    <FormItem><FormLabel>Lieu de Stock</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un lieu" /></SelectTrigger></FormControl>
                          <SelectContent>{lieuxStock.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="prix" render={({ field }) => (<FormItem><FormLabel>Prix de vente</FormLabel><FormControl><Input type="number" step="any" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="qte" render={({ field }) => (<FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="qteMin" render={({ field }) => (<FormItem><FormLabel>Alerte Stock</FormLabel><FormControl><Input type="number" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                  <Button type="submit" disabled={isLoading}>{isLoading ? "Sauvegarde..." : (editingProduit ? "Sauvegarder" : "Créer le produit")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline">Assignation groupée</DialogTitle>
                <DialogDescription>
                    Assigner {selectedProduits.length} produit(s) à une nouvelle catégorie et/ou un nouveau lieu de stock.
                </DialogDescription>
            </DialogHeader>
             <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4 py-2">
                    <FormField control={assignForm.control} name="categorieId" render={({ field }) => (
                        <FormItem><FormLabel>Nouvelle Catégorie (Optionnel)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={assignForm.control} name="lieuStockId" render={({ field }) => (
                        <FormItem><FormLabel>Nouveau Lieu de Stock (Optionnel)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir un lieu" /></SelectTrigger></FormControl>
                                <SelectContent>{lieuxStock.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Annuler</Button></DialogClose>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Assignation..." : "Assigner"}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
