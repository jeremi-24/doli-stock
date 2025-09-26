
"use client";

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import type { Commande } from '@/lib/types';
import { PlusCircle, Loader2, Check, XCircle, Eye, FileSearch } from 'lucide-react';
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

function OrdersPageContent() {
    const { commandes, bonLivraisons, isMounted, currentUser, hasPermission, validerCommande, annulerCommande } from 'useApp';
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
                router.push(`/orders/${commandeId}`);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, [commandeId]: false }));
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

    const sortedCommandes = React.useMemo(() => {
        return [...commandes]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(cmd => {
            const bl = bonLivraisons.find(b => b.commandeId === cmd.id);
            return { ...cmd, bonLivraison: bl || null };
          });
      }, [commandes, bonLivraisons]);
      
    
    const canValidateOrder = React.useMemo(() => hasPermission('COMMANDE_VALIDATE'), [hasPermission]);
    const canCancelOrder = React.useMemo(() => hasPermission('COMMANDE_CANCEL'), [hasPermission]);
    const canCreateOrder = React.useMemo(() => hasPermission('COMMANDE_CREATE'), [hasPermission]);

    const pageTitle = React.useMemo(() => {
        if (!currentUser) return "Commandes";
        const adminRoles = ['ADMIN', 'DG', 'SECRETARIAT', 'CONTROLLEUR'];
        if (adminRoles.includes(currentUser.roleNom)) {
            return "Toutes les commandes";
        }
        if (currentUser.lieuNom) {
            return `Commandes pour ${currentUser.lieuNom}`;
        }
        return "Vos Commandes";
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
                                    <TableHead>Statut CMD</TableHead>
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
                                    const isCancelled = cmd.statut === 'ANNULEE'; 

                                    return (
                                        <TableRow key={cmd.id} className={cn(
                                            isCancelled && '  pointer-events-none', 
                                          )} >
                                            <TableCell className="font-mono text-xs">CMD-{String(cmd.id).padStart(5, '0')}</TableCell>
                                            <TableCell>{format(new Date(cmd.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell>
                                                {currentUser?.clientId === cmd.client?.id ? <Badge variant="outline">Vous</Badge> : (cmd.client?.nom || 'N/A')}
                                            </TableCell>
                                            <TableCell>{cmd.lieuLivraison?.nom || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(cmd.totalCommande)}</TableCell>
                                            <TableCell>
                                                <Badge variant={cmd.statut === 'VALIDEE' ? 'default' : (cmd.statut === 'ANNULEE' ? 'destructive' : 'secondary')}
                                                       className={cn(cmd.statut === 'EN_ATTENTE' && 'bg-orange-500/80 text-white', cmd.statut === 'LIVREE' && 'bg-green-600 text-white')}>
                                                    {cmd.statut.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                             <TableCell>
                                             {cmd.bonLivraison ? (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        cmd.bonLivraison.status === 'LIVRE' && 'bg-green-100 text-green-700',
        cmd.bonLivraison.status === 'EN_ATTENTE' && 'bg-blue-100 text-blue-600',
        cmd.bonLivraison.status === 'A_LIVRER' && 'bg-orange-100 text-orange-800 '
      )}
    >
      {cmd.bonLivraison.status.replace('_', ' ')}
    </Badge>
  ) : (
    <Badge variant="secondary">ANNULEE</Badge>
  )}
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
                                                        
                                                        {(isPendingAction || isValidated) && <DropdownMenuSeparator />}
                                                        
                                                        {isPendingAction && canValidateOrder && (
                                                            <DropdownMenuItem onClick={() => handleValidation(cmd.id)}>
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Valider
                                                            </DropdownMenuItem>
                                                        )}

                                                        { (isValidated && canCancelOrder) && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                     <Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
                                                                        <XCircle className="mr-2 h-4 w-4" /> 
                                                                        Annuler (Forcé)
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Cette action est irréversible. La facture et le bon de livraison associés seront supprimés, et les stocks seront restaurés.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Retour</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleAction(annulerCommande, cmd.id)}>Confirmer l'annulation</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                         { (isPendingAction && canCancelOrder) && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                     <Button variant="ghost" className="w-full justify-start text-sm font-normal text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto relative flex cursor-default select-none items-center rounded-sm">
                                                                        <XCircle className="mr-2 h-4 w-4" /> 
                                                                        Rejeter
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Rejeter la commande ?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Cette action est irréversible et annulera la commande.
                                                                        </AlertDialogDescription>
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

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OrdersPageContent />
        </Suspense>
    );
}
