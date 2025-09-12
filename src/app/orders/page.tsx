

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import type { Commande } from '@/lib/types';
import { PlusCircle, Loader2, Check, FileSignature, Truck, XCircle, Eye, FileSearch } from 'lucide-react';
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
import { OrderPreviewDialog } from '@/components/order-preview-dialog';
import { cn } from '@/lib/utils';


export default function OrdersPage() {
    const { commandes, isMounted, currentUser, hasPermission, validerCommande, annulerCommande, genererFacture, genererBonLivraison } = useApp();
    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const [previewingOrder, setPreviewingOrder] = useState<Commande | null>(null);
    
    const handleAction = async (action: (id: number) => Promise<any>, commandeId: number) => {
        setLoadingStates(prev => ({ ...prev, [commandeId]: true }));
        try {
            await action(commandeId);
        } finally {
            setLoadingStates(prev => ({ ...prev, [commandeId]: false }));
        }
    };
    
    const handleValidation = async (commandeId: number) => {
        setLoadingStates(prev => ({ ...prev, [commandeId]: true }));
        try {
            const result = await validerCommande(commandeId);
            if (result) {
                // Redirect to the new document view page after validation
                router.push(`/orders/${commandeId}`);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, [commandeId]: false }));
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

    const sortedCommandes = React.useMemo(() => 
        [...commandes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [commandes]);
    
    const canValidateOrder = React.useMemo(() => hasPermission('COMMANDE_VALIDATE'), [hasPermission]);
    const canCancelOrder = React.useMemo(() => hasPermission('COMMANDE_CANCEL'), [hasPermission]);
    const canGenerateInvoice = React.useMemo(() => hasPermission('FACTURE_GENERATE'), [hasPermission]);
    const canGenerateBL = React.useMemo(() => hasPermission('LIVRAISON_GENERATE'), [hasPermission]);
    const canCreateOrder = React.useMemo(() => hasPermission('COMMANDE_CREATE'), [hasPermission]);

    const pageTitle = React.useMemo(() => {
        if (!currentUser) return "Commandes";
        const role = currentUser.roleNom;
        if (role === 'BOUTIQUIER') {
            return `Commandes pour ${currentUser.lieuNom || 'votre lieu'}`;
        }
        if (['ADMIN', 'DG', 'SECRETARIAT', 'CONTROLLEUR'].includes(role)) {
            return "Toutes les commandes";
        }
        return `Commandes pour ${currentUser.lieuNom || 'votre lieu'}`;
    }, [currentUser]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-semibold">{pageTitle}</h1>
                <div className="ml-auto">
                    {canCreateOrder && (
                        <Button size="sm" onClick={() => router.push('/orders/new')}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Nouvelle Commande
                        </Button>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                  
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
                                    <TableHead>Statut CDE</TableHead>
                                    <TableHead>Statut BL</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                     <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : sortedCommandes.length > 0 ? sortedCommandes.map(cmd => {
                                    const isLoading = loadingStates[cmd.id];
                                    const isPendingAction = cmd.statut === 'EN_ATTENTE';
                                    const isValidated = cmd.statut === 'VALIDEE' || cmd.statut === 'LIVREE';

                                    return (
                                        <TableRow key={cmd.id}>
                                            <TableCell className="font-mono text-xs">CMD-{String(cmd.id).padStart(5, '0')}</TableCell>
                                            <TableCell>{format(new Date(cmd.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell>{cmd.client?.nom || 'N/A'}</TableCell>
                                            <TableCell>{cmd.lieuLivraison?.nom || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(cmd.totalCommande)}</TableCell>
                                            <TableCell>
                                                <Badge variant={cmd.statut === 'VALIDEE' ? 'default' : (cmd.statut === 'ANNULEE' ? 'destructive' : 'secondary')}
                                                       className={cn(cmd.statut === 'EN_ATTENTE' && 'bg-orange-500/80 text-white', cmd.statut === 'LIVREE' && 'bg-green-600 text-white')}>
                                                    {cmd.statut.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                             <TableCell>
                                                <Badge variant="outline">{cmd.statutBonLivraison?.replace('_', ' ') || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            aria-haspopup="true"
                                                            size="icon"
                                                            variant="ghost"
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                                            <span className="sr-only">Ouvrir le menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setPreviewingOrder(cmd)}>
                                                            <FileSearch className="mr-2 h-4 w-4" />
                                                            Voir la commande
                                                        </DropdownMenuItem>

                                                        {isValidated && (
                                                            <DropdownMenuItem onClick={() => router.push(`/orders/${cmd.id}`)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Voir les documents
                                                            </DropdownMenuItem>
                                                        )}
                                                        
                                                        {isPendingAction && (canValidateOrder || canCancelOrder) && <DropdownMenuSeparator />}
                                                        
                                                        {isPendingAction && canValidateOrder && (
                                                            <DropdownMenuItem onClick={() => handleValidation(cmd.id)}>
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Valider
                                                            </DropdownMenuItem>
                                                        )}
                                                        {isPendingAction && canCancelOrder && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                     <Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
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
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">Aucune commande trouvée.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
             <OrderPreviewDialog
                isOpen={!!previewingOrder}
                onOpenChange={(open) => {
                    if (!open) setPreviewingOrder(null);
                }}
                commande={previewingOrder}
            />
        </div>
    )
}
