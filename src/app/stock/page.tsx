
"use client";
import * as React from "react";
import * as z from "zod";
import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Barcode from "react-barcode";
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Warehouse, FileUp, Printer, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const produitSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  code_barre: z.string().min(5, "Le code-barres doit contenir au moins 5 caractères."),
  categorie_id: z.string().min(1, "Veuillez sélectionner une catégorie."),
  prix_achat: z.coerce.number().min(0, "Le prix d'achat doit être un nombre positif."),
  prix_vente: z.coerce.number().min(0, "Le prix de vente doit être un nombre positif."),
  quantite_stock: z.coerce.number().int().min(0, "La quantité doit être un entier positif."),
  unite: z.string().min(1, "L'unité est requise."),
  alerte_stock: z.coerce.number().int().min(0, "L'alerte de stock doit être un entier positif."),
});


function ImportDialog({ open, onOpenChange, onImportSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onImportSuccess: (newProducts: any[]) => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Aucun fichier sélectionné" });
      return;
    }
    setIsImporting(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://192.168.1.140/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue lors de l'importation.");
      }

      const importedData = await response.json();
      onImportSuccess(importedData);
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de l'importation", description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Importer des produits depuis Excel</DialogTitle>
          <DialogDescription>
            Le fichier doit contenir les colonnes : `nom`, `code_barre`, `categorie_nom`, `prix_achat`, `prix_vente`, `quantite_stock`, `unite`, `alerte_stock`. La `categorie_nom` doit correspondre à une catégorie existante.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isImporting} />
          {file && <p className="text-sm text-muted-foreground">Fichier : {file.name}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={isImporting}>Annuler</Button></DialogClose>
          <Button onClick={handleImport} disabled={!file || isImporting}>{isImporting ? "Importation..." : "Importer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BarcodePrintDialog({ open, onOpenChange, productsToPrint }: { open: boolean, onOpenChange: (open: boolean) => void, productsToPrint: Produit[] }) {
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow?.document.write('<html><head><title>Imprimer les codes-barres</title>');
      printWindow?.document.write(`<style>@media print { body { -webkit-print-color-adjust: exact; margin: 1cm; } @page { size: auto; margin: 1cm; } .no-print { display: none; } .barcode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 10px; } .barcode-item { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-inside: avoid; } .product-name { font-family: sans-serif; font-size: 10px; font-weight: bold; margin-bottom: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }</style>`);
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(printContent.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Imprimer les codes-barres</DialogTitle>
          <DialogDescription>Ajustez la mise en page via la boîte de dialogue d'impression de votre navigateur.</DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-y-auto p-4 border rounded-md">
            <div ref={printRef} className="barcode-grid">
            {productsToPrint.map((produit) => (
                <div key={produit.id} className="barcode-item">
                <p className="product-name">{produit.nom}</p>
                <Barcode value={produit.code_barre} height={40} width={1.5} fontSize={10} margin={5} />
                </div>
            ))}
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <Button onClick={handlePrint} disabled={!productsToPrint || productsToPrint.length === 0}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function StockPage() {
  const { produits, categories, addProduit, updateProduit, deleteProduit, addMultipleProduits } = useApp();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [productsToPrint, setProductsToPrint] = React.useState<Produit[]>([]);
  const [editingProduit, setEditingProduit] = React.useState<Produit | null>(null);
  const { toast } = useToast();

  const categoriesMap = React.useMemo(() => new Map(categories.map(c => [c.id, c.nom])), [categories]);

  const form = useForm<z.infer<typeof produitSchema>>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      nom: "", code_barre: "", categorie_id: "", prix_achat: 0,
      prix_vente: 0, quantite_stock: 0, unite: "pièce", alerte_stock: 0,
    },
  });

  React.useEffect(() => {
    form.reset(editingProduit || {
      nom: "", code_barre: "", categorie_id: "", prix_achat: 0,
      prix_vente: 0, quantite_stock: 0, unite: "pièce", alerte_stock: 0,
    });
  }, [editingProduit, form]);

  const handleAddNew = () => { setEditingProduit(null); setIsDialogOpen(true); };
  const handleEdit = (produit: Produit) => { setEditingProduit(produit); setIsDialogOpen(true); };
  const handlePrintAll = () => { setProductsToPrint(produits); setIsPrintDialogOpen(true); };
  const handlePrintSingle = (produit: Produit) => { setProductsToPrint([produit]); setIsPrintDialogOpen(true); };
  
  const onSubmit = (values: z.infer<typeof produitSchema>) => {
    if (editingProduit) {
      updateProduit({ ...editingProduit, ...values });
      toast({ title: "Produit mis à jour" });
    } else {
      addProduit(values);
      toast({ title: "Produit ajouté" });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (produitId: string) => { deleteProduit(produitId); toast({ title: "Produit supprimé", variant: 'destructive' }); };

  const handleImportSuccess = (importedData: any[]) => {
    const categoryNameToIdMap = new Map(categories.map(c => [c.nom.toLowerCase(), c.id]));
    const newProducts: Produit[] = [];
    let skippedCount = 0;

    for (const row of importedData) {
      const categorieNom = row.categorie_nom?.toLowerCase();
      const categorie_id = categoryNameToIdMap.get(categorieNom);
      if (categorie_id) {
        const parsed = produitSchema.safeParse({ ...row, categorie_id });
        if (parsed.success) {
            newProducts.push({ id: `imported-${Date.now()}-${newProducts.length}`, ...parsed.data });
        } else {
            skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    addMultipleProduits(newProducts);
    toast({ title: "Importation terminée", description: `${newProducts.length} produits importés. ${skippedCount} lignes ignorées.` });
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Gestion du Stock</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsImportDialogOpen(true)}><FileUp className="h-4 w-4 mr-2"/>Importer</Button>
          <Button size="sm" variant="outline" onClick={handlePrintAll} disabled={produits.length === 0}><Printer className="h-4 w-4 mr-2"/>Imprimer Codes-barres</Button>
          <Button size="sm" onClick={handleAddNew}><PlusCircle className="h-4 w-4 mr-2" />Ajouter un Produit</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Warehouse /> Vos Produits</CardTitle><CardDescription>La liste de tous les produits de votre inventaire.</CardDescription></CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Catégorie</TableHead><TableHead>Prix Vente</TableHead><TableHead className="text-right">Quantité</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {produits.length > 0 ? (
                  produits.map((produit) => (
                    <TableRow key={produit.id} className={produit.quantite_stock <= produit.alerte_stock ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                      <TableCell className="font-medium">{produit.nom} {produit.quantite_stock <= produit.alerte_stock && <AlertCircle className="h-4 w-4 inline-block ml-2 text-red-500" />}</TableCell>
                      <TableCell>{categoriesMap.get(produit.categorie_id) || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(produit.prix_vente)}</TableCell>
                      <TableCell className="text-right">{produit.quantite_stock} {produit.unite}(s)</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(produit)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintSingle(produit)}><Printer className="mr-2 h-4 w-4" /> Imprimer le code-barres</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Elle supprimera définitivement le produit "{produit.nom}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(produit.id)}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : ( <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun produit trouvé.</TableCell></TableRow> )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-headline">{editingProduit ? "Modifier le Produit" : "Ajouter un Produit"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="nom" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="T-Shirt" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="code_barre" render={({ field }) => (<FormItem><FormLabel>Code-barres</FormLabel><FormControl><Input placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="categorie_id" render={({ field }) => (
                  <FormItem><FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger></FormControl>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="prix_achat" render={({ field }) => (<FormItem><FormLabel>Prix d'achat</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="prix_vente" render={({ field }) => (<FormItem><FormLabel>Prix de vente</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="quantite_stock" render={({ field }) => (<FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="unite" render={({ field }) => (<FormItem><FormLabel>Unité</FormLabel><FormControl><Input placeholder="pièce, kg..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="alerte_stock" render={({ field }) => (<FormItem><FormLabel>Alerte Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button><Button type="submit">{editingProduit ? "Sauvegarder" : "Créer le produit"}</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} onImportSuccess={handleImportSuccess} />
      <BarcodePrintDialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} productsToPrint={productsToPrint} />
    </div>
  );
}
