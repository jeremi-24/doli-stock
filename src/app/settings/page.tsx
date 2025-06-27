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

const shopInfoSchema = z.object({
  name: z.string().min(1, "Le nom de la boutique est requis."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Adresse e-mail invalide.").or(z.literal('')).optional(),
});

const themeColorsSchema = z.object({
  primary: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 231 48% 48%)").trim(),
  background: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 220 13% 96%)").trim(),
  accent: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Utilisez le format 'H S% L%' (ex: 262 52% 50%)").trim(),
});


function ShopInfoForm() {
  const { shopInfo, setShopInfo } = useApp();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof shopInfoSchema>>({
    resolver: zodResolver(shopInfoSchema),
    defaultValues: shopInfo,
  });

  React.useEffect(() => {
    form.reset(shopInfo);
  }, [shopInfo, form]);

  function onSubmit(values: z.infer<typeof shopInfoSchema>) {
    setShopInfo(values as ShopInfo);
    toast({
      title: "Informations de la boutique mises à jour",
      description: "Les détails de votre boutique ont été enregistrés.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Boutique</CardTitle>
        <CardDescription>Configurez les informations de votre boutique.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la boutique</FormLabel>
                  <FormControl><Input placeholder="Le nom de votre boutique" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl><Input placeholder="123 Rue Principale, Lomé" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl><Input placeholder="+228 90 00 00 00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de contact</FormLabel>
                  <FormControl><Input placeholder="contact@maboutique.tg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Sauvegarder</Button>
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
  const [quantities, setQuantities] = React.useState<{ [key: string]: number }>({});
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const initialQuantities = products.reduce((acc, p) => {
        acc[p.id] = p.qte > 0 ? 1 : 0;
        return acc;
      }, {} as { [key: string]: number });
      setQuantities(initialQuantities);
    }
  }, [open, products]);

  const handleQuantityChange = (productId: number, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    } else if (value === '') {
      setQuantities(prev => ({ ...prev, [productId]: 0 }));
    }
  };

  const handlePrintRequest = async () => {
    const payload = products
      .map(p => ({
        produitNom: p.nom,
        quantite: quantities[p.id] || 0,
      }))
      .filter(p => p.quantite > 0);

    if (payload.length === 0) {
      toast({ variant: "destructive", title: "Aucun code-barres à imprimer", description: "Veuillez spécifier une quantité pour au moins un produit." });
      return;
    }

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
  
  const totalBarcodes = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Imprimer des codes-barres</DialogTitle>
          <DialogDescription>
            Spécifiez le nombre d'étiquettes à imprimer pour chaque produit. Les produits avec une quantité de 0 ne seront pas inclus.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] flex flex-col">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="w-[120px] text-right">Quantité</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {products.map((produit) => (
                    <TableRow key={produit.id}>
                        <TableCell className="font-medium">{produit.nom}</TableCell>
                        <TableCell className="text-right">
                            <Input
                                type="number"
                                value={quantities[produit.id] || 0}
                                onChange={(e) => handleQuantityChange(produit.id, e.target.value)}
                                className="h-8 w-20 ml-auto text-right"
                                min="0"
                                disabled={isPrinting}
                            />
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="sm:justify-between items-center border-t pt-4 mt-4">
          <div className="text-sm text-muted-foreground">
             Total: <span className="font-bold">{totalBarcodes}</span> étiquette(s)
          </div>
          <div className="flex gap-2">
            <DialogClose asChild><Button variant="ghost" disabled={isPrinting}>Annuler</Button></DialogClose>
            <Button onClick={handlePrintRequest} disabled={isPrinting || totalBarcodes === 0}>
                {isPrinting ? "Génération..." : <><Printer className="h-4 w-4 mr-2" />Générer le PDF</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { activeModules, setActiveModules, produits, addMultipleProduits, currentUser } = useApp();
  const { toast } = useToast();

  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isPrintRequestDialogOpen, setIsPrintRequestDialogOpen] = React.useState(false);

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
          <TabsTrigger value="shop"><Store className="mr-2 h-4 w-4"/>Boutique</TabsTrigger>
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
          
        <TabsContent value="shop" className="mt-6">
          <ShopInfoForm />
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
