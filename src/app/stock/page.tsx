
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Warehouse, FileUp, Printer } from "lucide-react";
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
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  barcode: z.string().min(5, "Le code-barres doit contenir au moins 5 caractères."),
  price: z.coerce.number().min(0, "Le prix doit être un nombre positif."),
  quantity: z.coerce.number().int().min(0, "La quantité doit être un entier positif."),
  category: z.string().min(2, "La catégorie doit contenir au moins 2 caractères."),
});

function ImportDialog({ open, onOpenChange, onImportSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onImportSuccess: (newProducts: Product[]) => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ variant: "destructive", title: "Aucun fichier sélectionné", description: "Veuillez sélectionner un fichier Excel à importer." });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const newProducts: Product[] = json.map((row, index) => {
          if (!row.name || !row.barcode || row.price == null || row.quantity == null || !row.category) {
            throw new Error(`Données invalides à la ligne ${index + 2}. Les colonnes requises sont : name, barcode, price, quantity, category.`);
          }
          return {
            id: `imported-${Date.now()}-${index}`,
            name: String(row.name),
            barcode: String(row.barcode),
            price: Number(row.price),
            quantity: Number(row.quantity),
            category: String(row.category),
          };
        });

        onImportSuccess(newProducts);
        onOpenChange(false);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Échec de l'importation", description: error.message });
      } finally {
        setIsImporting(false);
        setFile(null);
      }
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Erreur de fichier", description: "Impossible de lire le fichier sélectionné." });
        setIsImporting(false);
    }
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Importer des produits depuis Excel</DialogTitle>
          <DialogDescription>
            Chargez un fichier .xlsx ou .xls. Assurez-vous qu'il contient les colonnes : `name`, `barcode`, `price`, `quantity`, et `category`.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isImporting} />
          {file && <p className="text-sm text-muted-foreground">Fichier sélectionné : {file.name}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={isImporting}>Annuler</Button></DialogClose>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? "Importation..." : "Importer les produits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BarcodePrintDialog({ open, onOpenChange, productsToPrint }: { open: boolean, onOpenChange: (open: boolean) => void, productsToPrint: Product[] }) {
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow?.document.write('<html><head><title>Imprimer les codes-barres</title>');
      printWindow?.document.write(`
        <style>
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              margin: 1cm;
            }
            @page {
              size: auto;
              margin: 1cm;
            }
            .no-print { display: none; }
            .barcode-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px 10px;
            }
            .barcode-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                page-break-inside: avoid;
            }
            .product-name {
                font-family: sans-serif;
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 4px;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        </style>
      `);
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(printContent.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
      }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Imprimer les codes-barres des produits</DialogTitle>
          <DialogDescription>
            Vérifiez les codes-barres ci-dessous. Utilisez la boîte de dialogue d'impression de votre navigateur pour ajuster la taille du papier et la mise en page pour vos étiquettes.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-y-auto p-4 border rounded-md">
            {productsToPrint && productsToPrint.length > 0 ? (
                <div ref={printRef} className="barcode-grid">
                {productsToPrint.map((product) => (
                    <div key={product.id} className="barcode-item">
                    <p className="product-name">{product.name}</p>
                    <Barcode value={product.barcode} height={40} width={1.5} fontSize={10} margin={5} />
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground h-full flex items-center justify-center">Aucun produit à imprimer.</p>
            )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <Button onClick={handlePrint} disabled={!productsToPrint || productsToPrint.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function StockPage() {
  const { products, addProduct, updateProduct, deleteProduct, addMultipleProducts } = useApp();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [productsToPrint, setProductsToPrint] = React.useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      barcode: "",
      price: 0,
      quantity: 0,
      category: "",
    },
  });

  React.useEffect(() => {
    if (editingProduct) {
      form.reset(editingProduct);
    } else {
      form.reset({
        name: "",
        barcode: "",
        price: 0,
        quantity: 0,
        category: "",
      });
    }
  }, [editingProduct, form]);

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handlePrintAll = () => {
    setProductsToPrint(products);
    setIsPrintDialogOpen(true);
  };

  const handlePrintSingle = (product: Product) => {
    setProductsToPrint([product]);
    setIsPrintDialogOpen(true);
  };
  
  const onSubmit = (values: z.infer<typeof productSchema>) => {
    if (editingProduct) {
      updateProduct({ ...editingProduct, ...values });
      toast({ title: "Produit mis à jour", description: `Le produit ${values.name} a été mis à jour.` });
    } else {
      addProduct({ id: Date.now().toString(), ...values });
      toast({ title: "Produit ajouté", description: `Le produit ${values.name} a été ajouté au stock.` });
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId);
    toast({ title: "Produit supprimé", description: "Le produit a été retiré du stock.", variant: 'destructive' });
  };

  const handleImportSuccess = (newProducts: Product[]) => {
    const existingBarcodes = new Set(products.map(p => p.barcode));
    const uniqueNewProducts = newProducts.filter(p => !existingBarcodes.has(p.barcode));
    const skippedCount = newProducts.length - uniqueNewProducts.length;

    addMultipleProducts(uniqueNewProducts);

    toast({
        title: "Importation terminée",
        description: `${uniqueNewProducts.length} produits importés. ${skippedCount} doublons ont été ignorés.`
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Gestion du Stock</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <FileUp className="h-4 w-4 mr-2"/>
            Importer depuis Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrintAll} disabled={products.length === 0}>
            <Printer className="h-4 w-4 mr-2"/>
            Imprimer Tous les Codes-barres
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un Produit
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Warehouse /> Vos Produits</CardTitle>
            <CardDescription>La liste de tous les produits de votre inventaire.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Code-barres</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handlePrintSingle(product)}>
                              <Printer className="mr-2 h-4 w-4" /> Imprimer le code-barres
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
                                        Cette action est irréversible. Elle supprimera définitivement le produit "{product.name}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(product.id)}>Supprimer</AlertDialogAction>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      Aucun produit trouvé. Commencez par ajouter un nouveau produit ou importez depuis Excel.
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
            <DialogTitle className="font-headline">{editingProduct ? "Modifier le Produit" : "Ajouter un Nouveau Produit"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Mettez à jour les détails de votre produit." : "Remplissez les détails du nouveau produit."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code-barres</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Habillement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit">{editingProduct ? "Sauvegarder" : "Créer le produit"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
      <BarcodePrintDialog 
        open={isPrintDialogOpen} 
        onOpenChange={setIsPrintDialogOpen} 
        productsToPrint={productsToPrint}
      />
    </div>
  );
}
