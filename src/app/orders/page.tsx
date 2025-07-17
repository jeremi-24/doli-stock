
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import type { Commande, ValidationCommandeResponse } from '@/lib/types';
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
import { DocumentPreviewDialog } from '@/components/document-preview-dialog';


export default function OrdersPage() {
    const { commandes, isMounted, currentUser, hasPermission, validerCommande, annulerCommande, genererFacture, genererBonLivraison } = useApp();
    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const [validationData, setValidationData] = useState<ValidationCommandeResponse | null>(null);

    const handleAction = async <T,>(action: (id: number) => Promise<T | void>, commandeId: number, callback?: (result: T) => void) => {
        setLoadingStates(prev => ({ ...prev, [commandeId]: true }));
        try {
            const result = await action(commandeId);
            if (result && callback) {
                callback(result as T);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, [commandeId]: false }));
        }
    };
    
    const handleValidate = (result: ValidationCommandeResponse) => {
        setValidationData(result);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

    const sortedCommandes = React.useMemo(() => 
        [...commandes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [commandes]);
    
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
                                    const isPendingSecretariatAction = ( currentUser?.role?.nom === 'SECRETARIAT'  || currentUser?.role?.nom === 'ADMIN') && cmd.statut === 'EN_ATTENTE';

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
                                                ) : isPendingSecretariatAction ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" onClick={() => handleAction(validerCommande, cmd.id, handleValidate)} disabled={isLoading}>
                                                            <Check className="mr-2 h-4 w-4" /> Valider
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="sm" variant="destructive" disabled={isLoading}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Rejeter la commande ?</AlertDialogTitle>
                                                                    <AlertDialogDescription>Cette action est irréversible et annulera la commande.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleAction(annulerCommande, cmd.id)}>Confirmer le rejet</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isLoading}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
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
                                                                    {(canGenerateInvoice || canGenerateBL) && <DropdownMenuSeparator />}
                                                                </>
                                                            )}
                                                            <DropdownMenuItem disabled>
                                                                {cmd.statut === 'EN_ATTENTE' ? 'En attente de validation' : `Commande ${cmd.statut.toLowerCase()}`}
                                                            </DropdownMenuItem>
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
            {validationData && (
                <DocumentPreviewDialog 
                    isOpen={!!validationData}
                    onOpenChange={() => setValidationData(null)}
                    facture={validationData.facture}
                    bonLivraison={validationData.bonLivraison}
                />
            )}
        </div>
    )
}
