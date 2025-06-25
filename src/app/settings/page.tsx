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
  name: z.string().min(1, "Shop name is required."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").or(z.literal('')).optional(),
});

const themeColorsSchema = z.object({
  primary: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Use 'H S% L%' format (e.g. 231 48% 48%)").trim(),
  background: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Use 'H S% L%' format (e.g. 220 13% 96%)").trim(),
  accent: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, "Use 'H S% L%' format (e.g. 262 52% 50%)").trim(),
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
      title: "Shop Info Updated",
      description: "Your shop details have been saved.",
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
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl><Input placeholder="Your Shop Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="555-123-4567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input placeholder="contact@yourshop.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save Changes</Button>
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
      title: "Theme Updated",
      description: "Your new color scheme has been applied.",
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
                  <FormLabel>Primary Color</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormDescription>Enter an HSL value, e.g., "231 48% 48%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                   <FormDescription>Enter an HSL value, e.g., "220 13% 96%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                   <FormDescription>Enter an HSL value, e.g., "262 52% 50%"</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save & Apply Theme</Button>
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
        title: "Settings Updated",
        description: `The ${module} module has been ${newState[module] ? 'enabled' : 'disabled'}.`,
      });
      return newState;
    });
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
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
              <CardTitle className="font-headline">Module Management</CardTitle>
              <CardDescription>Enable or disable modules to customize your workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                  <Warehouse className="h-6 w-6 mt-1 text-primary"/>
                  <div>
                    <Label htmlFor="stock-module" className="font-semibold text-base">Stock Management</Label>
                    <p className="text-sm text-muted-foreground">
                      Track product quantities, prices, and categories. Required for other modules.
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
                    <Label htmlFor="invoicing-module" className="font-semibold text-base">Invoicing</Label>
                    <p className="text-sm text-muted-foreground">
                      Create and manage simple invoices for customers.
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
                    <Label htmlFor="pos-module" className="font-semibold text-base">Point of Sale</Label>
                    <p className="text-sm text-muted-foreground">
                      A streamlined interface for quick in-person sales.
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
                    <Label htmlFor="barcode-module" className="font-semibold text-base">Barcode Scanner</Label>
                    <p className="text-sm text-muted-foreground">
                      Use the dashboard to quickly look up products by barcode.
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
                Changes are saved automatically. Some features may require a page reload to apply.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Import de données</CardTitle>
                <CardDescription>Gérez l'importation de vos données, comme la liste de produits.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <Import className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Vous pouvez déjà importer des produits depuis la page "Stock".</p>
                    <Button variant="outline" className="mt-4" asChild>
                       <a href="/stock">Go to Stock Page</a>
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
              <Button disabled>Add User</Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Demo User</TableCell>
                        <TableCell>admin@stockhero.dev</TableCell>
                        <TableCell><Badge variant="secondary">Admin</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                 <p className="mt-4 text-sm text-muted-foreground text-center">User management is coming soon.</p>
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
