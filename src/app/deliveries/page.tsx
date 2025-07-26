
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import { Truck, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BonLivraisonStatus } from '@/lib/types';

export default function DeliveriesPage() {
    const { bonLivraisons, isMounted, validerLivraisonEtape1, validerLivraisonEtape2, hasPermission } = useApp();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

    const handleAction = async (action: (id: number) => Promise<void>, livraisonId: number) => {
        setLoadingStates(prev => ({ ...prev, [livraisonId]: true }));
        try {
            await action(livraisonId);
        } finally {
            setLoadingStates(prev => ({ ...prev, [livraisonId]: false }));
        }
    };
    
    const canValidateEtape1 = React.useMemo(() => hasPermission('LIVRAISON_VALIDATE_ETAPE1'), [hasPermission]);
    const canValidateEtape2 = React.useMemo(() => hasPermission('LIVRAISON_VALIDATE_ETAPE2'), [hasPermission]);

    const getStatusInfo = (status: BonLivraisonStatus) => {
        switch (status) {
            case 'EN_ATTENTE': return { text: 'En attente', className: 'bg-orange-100 text-orange-800' };
            case 'VALIDE_SECRETARIAT': return { text: 'Validé (Sec.)', className: 'bg-yellow-100 text-yellow-800'};
            case 'A_LIVRER': return { text: 'À livrer', className: 'bg-blue-100 text-blue-800' };
            case 'LIVRE': return { text: 'Livré', className: 'bg-green-100 text-green-800' };
            default: return { text: status, className: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Bons de Livraison</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Truck /> Livraisons à Valider</CardTitle>
                    <CardDescription>Liste des bons de livraison en attente de validation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Commande</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Lieu Stock</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6} className="py-4">
                                                <Loader2 className="animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : bonLivraisons.length > 0 ? (
                                    bonLivraisons.map((bl) => {
                                        const isLoading = loadingStates[bl.id];
                                        const statusInfo = getStatusInfo(bl.status);
                                        const isDone = bl.status === 'LIVRE';

                                        const showValidateEtape1 = canValidateEtape1 && bl.status === 'EN_ATTENTE';
                                        const showValidateEtape2 = canValidateEtape2 && bl.status === 'A_LIVRER';

                                        return (
                                            <TableRow key={bl.id}>
                                                <TableCell className="font-mono">CMD-{String(bl.commandeId).padStart(5, '0')}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {bl.dateLivraison ? format(new Date(bl.dateLivraison), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{bl.agent}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{bl.lieuStock.nom}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={isDone ? 'default' : 'secondary'} className={cn(statusInfo.className)}>
                                                        {statusInfo.text}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isDone ? (
                                                        <Button size="sm" disabled>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Validé
                                                        </Button>
                                                    ) : showValidateEtape1 ? (
                                                        <Button size="sm" onClick={() => handleAction(validerLivraisonEtape1, bl.id)} disabled={isLoading}>
                                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Valider BL
                                                        </Button>
                                                    ) : showValidateEtape2 ? (
                                                        <Button size="sm" onClick={() => handleAction(validerLivraisonEtape2, bl.id)} disabled={isLoading}>
                                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Confirmer Réception
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">En attente...</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Aucun bon de livraison à traiter.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
