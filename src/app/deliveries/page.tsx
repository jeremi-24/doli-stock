

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-provider';
import { Truck, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BonLivraison, BonLivraisonStatus, PaiementInitialPayload, TypePaiement, ModePaiement } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


function PaymentDialog({
  isOpen,
  onOpenChange,
  total,
  onConfirm,
  isSaving,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (details: { typePaiement: TypePaiement, paiement?: PaiementInitialPayload }) => void;
  isSaving: boolean;
}) {
  const [typePaiement, setTypePaiement] = useState<TypePaiement>(TypePaiement.CREDIT);
  const [montant, setMontant] = useState(0);
  const [modePaiement, setModePaiement] = useState<ModePaiement>(ModePaiement.ESPECE);
  const [reference, setReference] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  useEffect(() => {
    if (isOpen) {
      setTypePaiement(TypePaiement.CREDIT);
      setMontant(0);
      setModePaiement(ModePaiement.ESPECE);
      setReference("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (typePaiement === TypePaiement.COMPTANT) {
      setMontant(total);
    }
  }, [typePaiement, total]);

  const handleSubmit = () => {
    const paiement = { montant, modePaiement, reference };
    
    if (typePaiement === TypePaiement.COMPTANT) {
      onConfirm({ typePaiement, paiement: { ...paiement, montant: total } });
    } else { // CREDIT
      onConfirm({ typePaiement, paiement: montant > 0 ? paiement : undefined });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Valider la Commande et le Paiement</DialogTitle>
          <DialogDescription>Confirmez le type de paiement pour cette livraison.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">Montant Total de la Commande</p>
            <p className="text-4xl font-bold">{formatCurrency(total)}</p>
          </div>
          <div className="space-y-2">
            <Label>Type de Paiement</Label>
            <RadioGroup value={typePaiement} onValueChange={(v) => setTypePaiement(v as TypePaiement)} className="flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value={TypePaiement.CREDIT} id="credit"/><Label htmlFor="credit">Crédit / Acompte</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value={TypePaiement.COMPTANT} id="comptant"/><Label htmlFor="comptant">Comptant</Label></div>
            </RadioGroup>
          </div>
          
          {typePaiement === TypePaiement.CREDIT && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="montant-initial">Paiement initial (Acompte)</Label>
                <Input id="montant-initial" type="number" value={montant} onChange={e => setMontant(Number(e.target.value))} max={total} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode-paiement">Mode de Paiement</Label>
                <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as ModePaiement)}>
                    <SelectTrigger id="mode-paiement"><SelectValue placeholder="Mode"/></SelectTrigger>
                    <SelectContent>
                        {Object.values(ModePaiement).map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={isSaving}>Annuler</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Sauvegarde..." : "Valider le Bon de Livraison"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function DeliveriesPage() {
    const { bonLivraisons, isMounted, validerLivraisonEtape1, validerLivraisonEtape2, hasPermission } = useApp();
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const [selectedBL, setSelectedBL] = useState<BonLivraison | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const handleOpenPaymentDialog = (bl: BonLivraison) => {
        setSelectedBL(bl);
        setIsPaymentDialogOpen(true);
    };

    const handleConfirmPayment = async (details: { typePaiement: TypePaiement, paiement?: PaiementInitialPayload }) => {
        if (!selectedBL) return;

        setLoadingStates(prev => ({ ...prev, [selectedBL.id]: true }));
        try {
            await validerLivraisonEtape1(selectedBL.id, details.typePaiement, details.paiement);
            setIsPaymentDialogOpen(false);
            setSelectedBL(null);
        } finally {
            if (selectedBL) {
                setLoadingStates(prev => ({ ...prev, [selectedBL.id]: false }));
            }
        }
    };
    
    const handleValidateEtape2 = async (livraisonId: number) => {
        setLoadingStates(prev => ({ ...prev, [livraisonId]: true }));
        try {
            await validerLivraisonEtape2(livraisonId);
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
        <>
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
                                                            {bl.dateLivraison ? format(new Date(bl.dateLivraison), 'd MMM yyyy HH:mm', { locale: fr }) : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{bl.email || 'N/A'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{bl.lieuStock?.nom || 'N/A'}</div>
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
                                                            <Button size="sm" onClick={() => handleOpenPaymentDialog(bl)} disabled={isLoading}>
                                                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Valider BL
                                                            </Button>
                                                        ) : showValidateEtape2 ? (
                                                            <Button size="sm" onClick={() => handleValidateEtape2(bl.id)} disabled={isLoading}>
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
            {selectedBL && (
                 <PaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    total={selectedBL.totalLivraison}
                    onConfirm={handleConfirmPayment}
                    isSaving={!!loadingStates[selectedBL.id]}
                 />
            )}
        </>
    );
}
