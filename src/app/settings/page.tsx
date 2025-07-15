
"use client";

import * as React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useApp } from "@/context/app-provider";
import { useToast } from "@/hooks/use-toast";
import { Settings, Barcode as BarcodeIcon, Warehouse, FileText, ShoppingCart, Import, Users, Store, Palette, FileUp, Printer } from 'lucide-react';
import type { ShopInfo, ThemeColors, Produit } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import * as api from '@/lib/api';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';


const organisationSchema = z.object({
  nom: z.string().min(1, "Le nom de l'organisation est requis."),
  logoUrl: z.string().url("Veuillez entrer une URL valide.").optional().or(z.literal('')),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  numero: z.string().optional(), // NIF, SIRET...
  telephone: z.string().optional(),
  email: z.string().email("Adresse e-mail invalide.").or(z.literal('')).optional(),
});


const themeColorsSchema = z.object({
  primary: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 231 48% 48%)").trim(),
  background: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 220 13% 96%)").trim(),
  accent: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 262 52% 50%)").trim(),
});


function OrganisationForm() {
  const { shopInfo, setShopInfo } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<z.infer<typeof organisationSchema>>({
    resolver: zodResolver(organisationSchema),
    defaultValues: shopInfo,
  });

  React.useEffect(() => {
    form.reset(shopInfo);
  }, [shopInfo, form]);

  async function onSubmit(values: z.infer<typeof organisationSchema>) {
    setIsLoading(true);
    try {
        await setShopInfo({ ...shopInfo, ...values });
    } catch (error) {
        // Error is handled in the context
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Organisation</CardTitle>
        <CardDescription>Configurez les informations de votre organisation.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="nom" render={({ field }) => (
                <FormItem><FormLabel>Nom de l'organisation</FormLabel><FormControl><Input placeholder="Le nom de votre organisation" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="logoUrl" render={({ field }) => (
                <FormItem><FormLabel>URL du logo</FormLabel><FormControl><Input placeholder="https://votresite.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="adresse" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue Principale" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="ville" render={({ field }) => (
                    <FormItem><FormLabel>Ville</FormLabel><FormControl><Input placeholder="Lomé" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="telephone" render={({ field }) => (
                    <FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input placeholder="+228 90 00 00 00" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email de contact</FormLabel><FormControl><Input placeholder="contact@maboutique.tg" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="numero" render={({ field }) => (
                <FormItem><FormLabel>N° d'identification (NIF, SIRET...)</FormLabel><FormControl><Input placeholder="Entrez votre numéro d'identification fiscale ou d'entreprise" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder les changements
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function AppearanceForm() {
  const { themeColors, setThemeColors } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof themeColorsSchema>>({
    resolver: zodResolver(themeColorsSchema),
    defaultValues: themeColors,
  });

  React.useEffect(() => {
    form.reset(themeColors);
  }, [themeColors, form]);

  function onSubmit(values: z.infer<typeof themeColorsSchema>) {
    setThemeColors(values as ThemeColors);
    toast({
      title: "Thème mis à jour",
      description: "Votre nouveau thème de couleurs a été appliqué.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Apparence</CardTitle>
        <CardDescription>Personnalisez l'apparence de votre application.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur Principale</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormDescription>Entrez une valeur HSL, ex: "231 48% 48%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur de Fond</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                   <FormDescription>Entrez une valeur HSL, ex: "220 13% 96%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur d'Accent</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                   <FormDescription>Entrez une valeur HSL, ex: "262 52% 50%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Sauvegarder et Appliquer</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

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

    try {
      const importedData = await api.importProducts(file);
      onImportSuccess(importedData || []);
      toast({ title: "Importation réussie", description: `${(importedData || []).length} produits ont été ajoutés ou mis à jour.` });
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
            Le fichier doit contenir les colonnes : `nom`, `ref`, `codeBarre`, `categorieId`, `entrepotId`, `prix`, `qte`, `qteMin`. Les IDs de catégorie et d'entrepôt doivent correspondre à des entrées existantes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} disabled={isImporting} />
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

function PrintRequestDialog({ open, onOpenChange, products }: { open: boolean, onOpenChange: (open: boolean) => void, products: Produit[] }) {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>();
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedProductId(undefined);
      setQuantity(1);
    }
  }, [open]);

  const handlePrintRequest = async () => {
    if (!selectedProductId || quantity <= 0) {
      toast({ variant: "destructive", title: "Informations manquantes", description: "Veuillez sélectionner un produit et entrer une quantité valide." });
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId, 10));

    if (!selectedProduct) {
        toast({ variant: "destructive", title: "Produit non trouvé", description: "Le produit sélectionné n'existe pas." });
        return;
    }

    const payload ={
        produitNom: selectedProduct.nom,
        quantite: quantity,
    };

    setIsPrinting(true);
    try {
      const pdfBlob = await api.printBarcodes(payload);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codes-barres-${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      onOpenChange(false);
      toast({ title: "PDF généré avec succès", description: "Le téléchargement de votre fichier de codes-barres a commencé." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de l'impression", description: error.message });
    } finally {
      setIsPrinting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Imprimer des codes-barres</DialogTitle>
          <DialogDescription>
            Choisissez un produit et spécifiez le nombre d'étiquettes à imprimer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="product-select">Produit</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isPrinting}>
                    <SelectTrigger id="product-select">
                        <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map((produit) => (
                             <SelectItem key={produit.id} value={String(produit.id)}>{produit.nom}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="quantity-input">Quantité</Label>
                <Input
                    id="quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    disabled={isPrinting}
                />
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button variant="ghost" disabled={isPrinting}>Annuler</Button></DialogClose>
            <Button onClick={handlePrintRequest} disabled={isPrinting || !selectedProductId || quantity <= 0}>
                {isPrinting ? "Génération..." : <><Printer className="h-4 w-4 mr-2" />Générer le PDF</>}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { activeModules, setActiveModules, produits, addMultipleProduits, currentUser, isMounted } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isPrintRequestDialogOpen, setIsPrintRequestDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (isMounted && currentUser?.role !== 'ADMIN') {
        router.push('/');
    }
  }, [isMounted, currentUser, router]);

  const handleModuleToggle = (module: keyof typeof activeModules) => {
    setActiveModules(prev => {
      const newState = { ...prev, [module]: !prev[module] };
      toast({
        title: "Paramètres mis à jour",
        description: `Le module ${module} a été ${newState[module] ? 'activé' : 'désactivé'}.`,
      });
      return newState;
    });
  };

  const handleImportSuccess = (importedData: any[]) => {
    addMultipleProduits(importedData);
  };
  
  const handlePrintAll = () => { 
    setIsPrintRequestDialogOpen(true); 
  };
  
  if (currentUser?.role !== 'ADMIN') {
      return (
          <div className="flex flex-1 flex-col items-center justify-center h-full">
              <p>Accès non autorisé.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Paramètres</h1>
      </div>
      
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="modules"><Settings className="mr-2 h-4 w-4"/>Modules</TabsTrigger>
          <TabsTrigger value="import"><Import className="mr-2 h-4 w-4"/>Import/Export</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Utilisateurs</TabsTrigger>
          <TabsTrigger value="organisation"><Store className="mr-2 h-4 w-4"/>Organisation</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4"/>Apparence</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Gestion des Modules</CardTitle>
              <CardDescription>Activez ou désactivez des modules pour personnaliser votre application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                  <Warehouse className="h-6 w-6 mt-1 text-primary"/>
                  <div>
                    <Label htmlFor="stock-module" className="font-semibold text-base">Gestion de Stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Suivez les quantités, prix et catégories de produits. Requis pour les autres modules.
                    </p>
                  </div>
                </div>
                <Switch
                  id="stock-module"
                  checked={activeModules.stock}
                  onCheckedChange={() => handleModuleToggle('stock')}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                   <FileText className="h-6 w-6 mt-1 text-primary"/>
                  <div>
                    <Label htmlFor="invoicing-module" className="font-semibold text-base">Facturation</Label>
                    <p className="text-sm text-muted-foreground">
                      Créez et gérez des factures simples pour les clients.
                    </p>
                  </div>
                </div>
                <Switch
                  id="invoicing-module"
                  checked={activeModules.invoicing}
                  onCheckedChange={() => handleModuleToggle('invoicing')}
                />
              </div>

              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                   <ShoppingCart className="h-6 w-6 mt-1 text-primary"/>
                  <div>
                    <Label htmlFor="pos-module" className="font-semibold text-base">Point de Vente</Label>
                    <p className="text-sm text-muted-foreground">
                      Une interface simplifiée pour des ventes rapides en magasin.
                    </p>
                  </div>
                </div>
                <Switch
                  id="pos-module"
                  checked={activeModules.pos}
                  onCheckedChange={() => handleModuleToggle('pos')}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                    <BarcodeIcon className="h-6 w-6 mt-1 text-primary"/>
                  <div>
                    <Label htmlFor="barcode-module" className="font-semibold text-base">Scanner de Code-barres</Label>
                    <p className="text-sm text-muted-foreground">
                      Utilisez le tableau de bord pour rechercher rapidement des produits par code-barres.
                    </p>
                  </div>
                </div>
                <Switch
                  id="barcode-module"
                  checked={activeModules.barcode}
                  onCheckedChange={() => handleModuleToggle('barcode')}
                />
              </div>

            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Les modifications sont sauvegardées automatiquement. Certaines fonctionnalités peuvent nécessiter un rechargement de la page.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Import et Impression</CardTitle>
                <CardDescription>Gérez l'importation de vos données et imprimez des étiquettes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <h3 className="font-medium">Importer des produits</h3>
                    <p className="text-sm text-muted-foreground">
                        Ajoutez ou mettez à jour des produits en masse à partir d'un fichier Excel (.xlsx, .csv).
                    </p>
                    <Button onClick={() => setIsImportDialogOpen(true)}>
                        <FileUp className="mr-2 h-4 w-4"/>
                        Importer un fichier
                    </Button>
                </div>
                <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-medium">Imprimer les codes-barres</h3>
                    <p className="text-sm text-muted-foreground">
                        Générez un fichier PDF avec les étiquettes de codes-barres pour vos produits.
                    </p>
                    <Button variant="outline" onClick={handlePrintAll} disabled={produits.length === 0}>
                        <Printer className="mr-2 h-4 w-4"/>
                        Imprimer des codes-barres
                    </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
          
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Utilisateurs</CardTitle>
                <CardDescription>Gérez les utilisateurs et leurs permissions.</CardDescription>
              </div>
              <Button disabled>Ajouter un utilisateur</Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Utilisateur Actuel</TableCell>
                        <TableCell>{currentUser?.email}</TableCell>
                        <TableCell><Badge variant="secondary">{currentUser?.role}</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                 <p className="mt-4 text-sm text-muted-foreground text-center">La gestion des utilisateurs sera bientôt disponible.</p>
            </CardContent>
          </Card>
        </TabsContent>
          
        <TabsContent value="organisation" className="mt-6">
          <OrganisationForm />
        </TabsContent>
          
        <TabsContent value="appearance" className="mt-6">
          <AppearanceForm />
        </TabsContent>
      </Tabs>
      <ImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} onImportSuccess={handleImportSuccess} />
      <PrintRequestDialog open={isPrintRequestDialogOpen} onOpenChange={setIsPrintRequestDialogOpen} products={produits} />
    </div>
  );
}
