
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
import { Settings, Barcode as BarcodeIcon, FileText, ShoppingCart, Import, Users, Store, Palette, FileUp, Printer, Building2 as Warehouse, ShieldCheck, PlusCircle, Trash2, Pencil, CheckCircle, XCircle } from 'lucide-react';
import type { ShopInfo, ThemeColors, Produit, Role, Utilisateur, LieuStock, Permission, RoleCreationPayload } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import * as api from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";


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

const userSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  roleId: z.string().min(1, "Veuillez sélectionner un rôle."),
  lieuId: z.string().min(1, "Veuillez sélectionner un lieu."),
});

const roleSchema = z.object({
  nom: z.string().min(2, "Le nom du rôle est requis."),
  permissions: z.record(z.boolean()),
});

const ALL_PERMISSIONS: { action: string, description: string }[] = [
    { action: 'PRODUIT_CREATE', description: 'Créer des produits' },
    { action: 'PRODUIT_READ', description: 'Consulter des produits' },
    { action: 'PRODUIT_UPDATE', description: 'Modifier des produits' },
    { action: 'PRODUIT_DELETE', description: 'Supprimer des produits' },
    { action: 'PRODUIT_IMPORT', description: 'Importer des produits' },
    { action: 'COMMANDE_CREATE', description: 'Créer des commandes' },
    { action: 'COMMANDE_READ', description: 'Consulter des commandes' },
    { action: 'COMMANDE_VALIDATE', description: 'Valider des commandes' },
    { action: 'COMMANDE_CANCEL', description: 'Annuler des commandes' },
    { action: 'LIVRAISON_GENERATE', description: 'Générer des bons de livraison' },
    { action: 'LIVRAISON_READ', description: 'Consulter des bons de livraison' },
    { action: 'LIVRAISON_VALIDATE_ETAPE1', description: 'Valider BL (Étape 1 - Secrétariat)' },
    { action: 'LIVRAISON_VALIDATE_ETAPE2', description: 'Valider BL (Étape 2 - Magasinier)' },
    { action: 'FACTURE_GENERATE', description: 'Générer des factures' },
    { action: 'FACTURE_DELETE', description: 'Supprimer des factures' },
    { action: 'VENTE_READ', description: 'Consulter l\'historique des ventes' },
    { action: 'INVENTAIRE_MANAGE', description: 'Gérer les inventaires' },
    { action: 'REAPPRO_MANAGE', description: 'Gérer les réapprovisionnements' },
    { action: 'USER_MANAGE', description: 'Gérer les utilisateurs et rôles' },
    { action: 'REPORT_VIEW', description: 'Voir les rapports' },
    { action: 'VENTE_CREATE', description: 'Créer des ventes (POS)'},
];


function OrganisationForm() {
  const { shopInfo, setShopInfo } = useApp();
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

function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<Utilisateur[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [lieux, setLieux] = React.useState<LieuStock[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormLoading, setFormIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", password: "", roleId: "", lieuId: "" },
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData, lieuxData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getLieuxStock(),
      ]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
      setLieux(lieuxData || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({ variant: "destructive", title: "Erreur de chargement", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function onSubmit(values: z.infer<typeof userSchema>) {
    setFormIsLoading(true);
    const payload = {
      email: values.email,
      password: values.password,
      roleId: parseInt(values.roleId, 10),
      lieuId: parseInt(values.lieuId, 10),
    };
    try {
        await api.createUser(payload);
        toast({ title: "Utilisateur créé avec succès" });
        setIsDialogOpen(false);
        form.reset();
        await fetchData(); // Refresh user list
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: "destructive", title: "Erreur de création", description: errorMessage });
    } finally {
        setFormIsLoading(false);
    }
  }

  const permissionDescriptions = React.useMemo(() => 
    new Map(ALL_PERMISSIONS.map(p => [p.action, p.description])), 
  []);
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Utilisateurs</CardTitle>
          <CardDescription>Gérez les utilisateurs et leurs permissions.</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>Ajouter un utilisateur</Button>
      </CardHeader>
      <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {isLoading ? (
                <div className="text-center p-8"><Loader2 className="animate-spin mx-auto" /></div>
            ) : users.length > 0 ? (
                users.map(user => (
                  <AccordionItem value={user.email} key={user.id}>
                    <AccordionTrigger>
                      <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-1 text-left">
                        <span className="font-semibold">{user.email}</span>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{user.roleNom}</Badge>
                          <Badge variant="outline">{user.lieuNom}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 pb-4">
                          <h4 className="font-semibold mb-2 text-sm">Permissions :</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            {user.permissions && user.permissions
                                .filter(p => p.autorise)
                                .map(permission => (
                                <li key={permission.id} className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>{permissionDescriptions.get(permission.action) || permission.action}</span>
                                </li>
                            ))}
                          </ul>
                          {(!user.permissions || user.permissions.filter(p => p.autorise).length === 0) && (
                            <p className="text-sm text-muted-foreground">Cet utilisateur n'a aucune permission spécifique.</p>
                          )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
            ) : (
              <div className="text-center text-muted-foreground p-8">Aucun utilisateur trouvé.</div>
            )}
          </Accordion>
      </CardContent>
    </Card>
    
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Ajouter un utilisateur</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="utilisateur@megatram.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="roleId" render={({ field }) => (
                    <FormItem><FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger></FormControl>
                          <SelectContent>{roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lieuId" render={({ field }) => (
                    <FormItem><FormLabel>Lieu de Stock</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un lieu" /></SelectTrigger></FormControl>
                          <SelectContent>{lieux.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="ghost" disabled={isFormLoading}>Annuler</Button></DialogClose>
                  <Button type="submit" disabled={isFormLoading}>
                    {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isFormLoading ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}

function RoleDialog({
    isOpen,
    onOpenChange,
    editingRole,
    onSave
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    editingRole: Role | null,
    onSave: () => void
}) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<z.infer<typeof roleSchema>>({
        resolver: zodResolver(roleSchema),
        defaultValues: { nom: "", permissions: {} }
    });

    React.useEffect(() => {
        const defaultPermissions: Record<string, boolean> = {};
        ALL_PERMISSIONS.forEach(p => defaultPermissions[p.action] = false);

        if (isOpen) {
            if (editingRole && editingRole.permissions) {
                const currentPermissions = { ...defaultPermissions };
                editingRole.permissions.forEach(p => {
                    if (p.autorise) currentPermissions[p.action] = true;
                });
                form.reset({ nom: editingRole.nom, permissions: currentPermissions });
            } else {
                form.reset({ nom: "", permissions: defaultPermissions });
            }
        }
    }, [isOpen, editingRole, form]);

    async function onSubmit(values: z.infer<typeof roleSchema>) {
        setIsSaving(true);
        
        const permissionsPayload: { action: string, autorise: boolean }[] = Object.entries(values.permissions).map(([action, autorise]) => ({
            action,
            autorise
        }));
        
        const payload: RoleCreationPayload = {
            nom: values.nom,
            permissions: permissionsPayload
        };

        try {
            if (editingRole) {
                await api.updateRole(editingRole.id, payload);
                toast({ title: "Rôle mis à jour" });
            } else {
                await api.createRole(payload);
                toast({ title: "Rôle créé" });
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
            toast({ variant: "destructive", title: "Erreur de sauvegarde", description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">{editingRole ? "Modifier le Rôle" : "Nouveau Rôle"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du rôle</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Magasinier" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormLabel>Permissions</FormLabel>
                            <div className="space-y-2 rounded-lg border p-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ALL_PERMISSIONS.map(permission => (
                                    <FormField
                                        key={permission.action}
                                        control={form.control}
                                        name={`permissions.${permission.action}`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">{permission.description}</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost" disabled={isSaving}>Annuler</Button></DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Sauvegarde..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function RolesTab() {
    const { toast } = useToast();
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);

    const fetchRoles = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const rolesData = await api.getRoles();
            setRoles(rolesData || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erreur de chargement des rôles";
            toast({ variant: "destructive", title: "Erreur", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleAddNew = () => {
        setEditingRole(null);
        setIsDialogOpen(true);
    };

    const handleEdit = async (role: Role) => {
        try {
            const detailedRole = await api.getRoleById(role.id);
            setEditingRole(detailedRole);
            setIsDialogOpen(true);
        } catch(error) {
             const errorMessage = error instanceof Error ? error.message : "Erreur de chargement du rôle";
            toast({ variant: "destructive", title: "Erreur", description: errorMessage });
        }
    };
    
    const handleDelete = async (roleId: number) => {
        try {
            await api.deleteRole(roleId);
            toast({title: "Rôle supprimé"});
            await fetchRoles();
        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : "Impossible de supprimer ce rôle.";
            toast({ variant: "destructive", title: "Erreur de suppression", description: errorMessage });
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Rôles & Permissions</CardTitle>
                        <CardDescription>Gérez les rôles et les actions qu'ils peuvent effectuer.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nouveau Rôle
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Rôle</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={2} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : roles.length > 0 ? (
                                    roles.map(role => (
                                        <TableRow key={role.id}>
                                            <TableCell className="font-medium">{role.nom}</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                                                    <Pencil className="h-4 w-4" />
                                                 </Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Supprimer le rôle "{role.nom}" ?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Cette action est irréversible. Assurez-vous qu'aucun utilisateur n'est assigné à ce rôle.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <DialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(role.id)}>Supprimer</AlertDialogAction>
                                                        </DialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={2} className="h-24 text-center">Aucun rôle trouvé.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <RoleDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} editingRole={editingRole} onSave={fetchRoles} />
        </>
    )
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
            Le fichier doit contenir les colonnes : `nom`, `ref`, `codeBarre`, `categorieId`, `lieuStockId`, `prix`, `qte`, `qteMin`. Les IDs doivent correspondre à des entrées existantes.
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
  const { addMultipleProduits, hasPermission } = useApp();
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isPrintRequestDialogOpen, setIsPrintRequestDialogOpen] = React.useState(false);
  const [produits, setProduits] = React.useState<Produit[]>([]);

  const canImport = React.useMemo(() => hasPermission('PRODUIT_IMPORT'), [hasPermission]);

  React.useEffect(() => {
    if (canImport) {
        api.getProducts().then(setProduits);
    }
  }, [canImport]);

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
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles"><ShieldCheck className="mr-2 h-4 w-4"/>Rôles & Permissions</TabsTrigger>
          {canImport && <TabsTrigger value="import"><Import className="mr-2 h-4 w-4"/>Import/Export</TabsTrigger>}
          <TabsTrigger value="organisation"><Store className="mr-2 h-4 w-4"/>Organisation</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4"/>Apparence</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
          
        <TabsContent value="roles" className="mt-6">
          <RolesTab />
        </TabsContent>

        {canImport && (
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
        )}
          
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
