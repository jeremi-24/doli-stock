
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import type { Commande } from '@/lib/types';
import { PlusCircle, FileStack, Loader2, Check, FileSignature, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function OrdersPage() {
    const { commandes, isMounted, currentUser, hasPermission, validerCommande, annulerCommande, genererFacture, genererBonLivraison } = useApp();
    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

    const handleAction = async (action: (id: number) => Promise<void>, commandeId: number) => {
        setLoadingStates(prev => ({ ...prev, [commandeId]: true }));
        await action(commandeId);
        setLoadingStates(prev => ({ ...prev, [commandeId]: false }));
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

    const sortedCommandes = React.useMemo(() => 
        [...commandes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [commandes]);
    
    const canValidate = React.useMemo(() => hasPermission('COMMANDE_VALIDATE'), [hasPermission]);
    const canCancel = React.useMemo(() => hasPermission('COMMANDE_CANCEL'), [hasPermission]);
    const canGenerateInvoice = React.useMemo(() => hasPermission('FACTURE_GENERATE'), [hasPermission]);
    const canGenerateBL = React.useMemo(() => hasPermission('LIVRAISON_GENERATE'), [hasPermission]);


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-semibold">Suivi des Commandes</h1>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => router.push('/orders/new')}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Nouvelle Commande
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileStack /> Toutes les commandes</CardTitle>
                    <CardDescription>Liste de toutes les commandes internes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Commande</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Lieu Livraison</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                     <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : sortedCommandes.length > 0 ? sortedCommandes.map(cmd => {
                                    const isLoading = loadingStates[cmd.id];
                                    return (
                                        <TableRow key={cmd.id}>
                                            <TableCell className="font-mono text-xs">CMD-{String(cmd.id).padStart(5, '0')}</TableCell>
                                            <TableCell>{format(new Date(cmd.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell>{cmd.client?.nom || 'N/A'}</TableCell>
                                            <TableCell>{cmd.lieuLivraison?.nom || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(cmd.totalCommande)}</TableCell>
                                            <TableCell>
                                                <Badge variant={cmd.statut === 'VALIDEE' ? 'default' : (cmd.statut === 'ANNULEE' ? 'destructive' : 'secondary')}>
                                                    {cmd.statut.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isLoading}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {cmd.statut === 'EN_ATTENTE' && (
                                                                <>
                                                                    {canValidate && (
                                                                        <DropdownMenuItem onClick={() => handleAction(validerCommande, cmd.id)}>
                                                                            <Check className="mr-2 h-4 w-4" /> Valider
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {canCancel && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="ghost" className="w-full justify-start text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
                                                                                    <XCircle className="mr-2 h-4 w-4" /> Annuler
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Cette action est irréversible.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleAction(annulerCommande, cmd.id)}>Annuler la commande</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </>
                                                            )}
                                                            {cmd.statut === 'VALIDEE' && (
                                                                <>
                                                                    {canGenerateInvoice && (
                                                                        <DropdownMenuItem onClick={() => handleAction(genererFacture, cmd.id)}>
                                                                            <FileSignature className="mr-2 h-4 w-4" /> Générer Facture
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {canGenerateBL && (
                                                                        <DropdownMenuItem onClick={() => handleAction(genererBonLivraison, cmd.id)}>
                                                                            <Truck className="mr-2 h-4 w-4" /> Générer BL
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                            {(cmd.statut !== 'EN_ATTENTE' && cmd.statut !== 'VALIDEE') && <DropdownMenuItem disabled>Aucune action</DropdownMenuItem>}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucune commande trouvée.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
