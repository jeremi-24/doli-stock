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
import { Settings, Barcode, Warehouse, FileText, ShoppingCart, Import, Users, Store, Palette, Badge } from 'lucide-react';
import type { ShopInfo, ThemeColors } from "@/lib/types";

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

export default function SettingsPage() {
  const { activeModules, setActiveModules } = useApp();
  const { toast } = useToast();

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
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Paramètres</h1>
      </div>
      
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="modules"><Settings className="mr-2 h-4 w-4"/>Modules</TabsTrigger>
          <TabsTrigger value="import"><Import className="mr-2 h-4 w-4"/>Import</TabsTrigger>
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
                    <Barcode className="h-6 w-6 mt-1 text-primary"/>
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
                <CardTitle className="font-headline">Import de Données</CardTitle>
                <CardDescription>Gérez l'importation de vos données, comme la liste de produits.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <Import className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Vous pouvez importer des produits depuis la page "Stock".</p>
                    <Button variant="outline" className="mt-4" asChild>
                       <a href="/stock">Aller à la page Stock</a>
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
                        <TableCell className="font-medium">Utilisateur de Démo</TableCell>
                        <TableCell>admin@stockhero.dev</TableCell>
                        <TableCell><Badge variant="secondary">Admin</Badge></TableCell>
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
    </div>
  );
}
