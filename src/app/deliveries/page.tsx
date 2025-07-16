
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import type { BonLivraison } from '@/lib/types';
import { Truck, CheckCircle, Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DeliveriesPage() {
    const { bonLivraisons, isMounted, validerLivraison } = useApp();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

    const handleValidate = async (livraisonId: number) => {
        setLoadingStates(prev => ({ ...prev, [livraisonId]: true }));
        await validerLivraison(livraisonId);
        setLoadingStates(prev => ({ ...prev, [livraisonId]: false }));
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-3xl font-semibold">Bons de Livraison</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Truck /> Livraisons à Valider</CardTitle>
                    <CardDescription>Liste des bons de livraison en attente de validation dans votre lieu de stock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Commande</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!isMounted ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} className="py-4"><Loader2 className="animate-spin mx-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : bonLivraisons.length > 0 ? (
                                    bonLivraisons.map((bl) => (
                                        <TableRow key={bl.id}>
                                            <TableCell className="font-mono">CMD-{String(bl.commandeId).padStart(5, '0')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {bl.dateLivraison ? format(new Date(bl.dateLivraison), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {bl.client.nom}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={bl.statut === 'LIVREE' ? "default" : "secondary"}>
                                                    {bl.statut === 'LIVREE' ? 'Livré' : 'En attente de validation'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleValidate(bl.id)}
                                                    disabled={bl.statut === 'LIVREE' || loadingStates[bl.id]}
                                                >
                                                    {loadingStates[bl.id] ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                    )}
                                                    {bl.statut === 'LIVREE' ? 'Validé' : 'Valider la réception'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Aucun bon de livraison à valider.</TableCell>
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
