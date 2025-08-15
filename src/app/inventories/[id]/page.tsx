
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Check, X, MoveRight, Package as UnitIcon, Box, Loader2, FileUp, AlertTriangle, CheckCircle, FilePenLine } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Inventaire, InventaireLigne } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as api from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirmInventaire } = useApp();
  
  const [inventory, setInventory] = useState<Inventaire | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchInventory = useCallback(async () => {
    const inventoryId = Number(id);
    if (isNaN(inventoryId)) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Identifiant d\'inventaire invalide.' });
      router.push('/inventories');
      return;
    }
    
    try {
        setIsLoading(true);
        const data = await api.getInventaire(inventoryId);
        setInventory(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger l'inventaire: ${errorMessage}` });
        router.push('/inventories');
    } finally {
        setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleConfirm = async (isPremier: boolean) => {
      if (!inventory) return;
      setIsConfirming(true);
      try {
          const result = await confirmInventaire(inventory.id, isPremier);
          if(result) {
            setInventory(result);
          }
      } finally {
          setIsConfirming(false);
      }
  }

  const EcartBadge = ({ ecart, type }: { ecart: number, type: 'carton' | 'unite' | 'total' }) => {
    let text = "";
    if (ecart > 0) text = `+${ecart}`;
    else text = `${ecart}`;

    let className = "font-semibold ";
    if (ecart === 0) className += "text-gray-500";
    else if (ecart > 0) className += "text-green-600";
    else className += "text-red-600";

    if (type === 'carton') return <span className={className}>{text} C</span>;
    if (type === 'unite') return <span className={className}>{text} U</span>;

    return <Badge variant={ecart === 0 ? "secondary" : (ecart > 0 ? "default" : "destructive")} className={cn(ecart > 0 && "bg-green-100 text-green-700", "font-bold")}>{text} Unités</Badge>;
  };
  
  const QteDisplay = ({ cartons, unites }: { cartons: number, unites: number }) => (
    <div className="flex items-center justify-end gap-2 text-xs">
        {cartons > 0 && <span className="flex items-center gap-1"><Box className="h-3 w-3" />{cartons} C</span>}
        {unites > 0 && <span className="flex items-center gap-1"><UnitIcon className="h-3 w-3" />{unites} U</span>}
        {(cartons === 0 && unites === 0) && '0'}
    </div>
  )


  if (isLoading || inventory === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-32" />
           </CardFooter>
        </Card>
      </div>
    );
  }

  if (inventory === null) {
     return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-8">
        <Alert variant="destructive" className="max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Inventaire introuvable</AlertTitle>
            <AlertDescription>
                L'inventaire que vous cherchez n'existe pas ou a été supprimé.
            </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/inventories')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retourner aux inventaires
        </Button>
      </div>
    );
  }

  const isConfirmed = inventory.statut === 'CONFIRME';

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/inventories')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Détails de l'Inventaire
        </h1>
        {isConfirmed ? (
            <Badge variant="default" className="bg-green-600 text-white gap-2">
                <CheckCircle className="h-4 w-4"/> Confirmé et Appliqué
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-orange-500 text-white gap-2">
                <AlertTriangle className="h-4 w-4"/> En attente de confirmation
            </Badge>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Inventaire N° INV-{String(inventory.id).padStart(5, '0')}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4"/> Chargé de l'inventaire: <span className="font-medium text-foreground">{inventory.charge}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Date: <span className="font-medium text-foreground">{format(new Date(inventory.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</span></div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader className='bg-gray-100/50' >
                        <TableRow>
                            <TableHead rowSpan={2} className="align-middle">Produit</TableHead>
                            <TableHead rowSpan={2} className="align-middle">Lieu de Stock</TableHead>
                            <TableHead colSpan={2} className="text-center border-b border-l">Quantité Avant Scan</TableHead>
                            <TableHead colSpan={2} className="text-center border-b border-l">Quantité Scannée</TableHead>
                            <TableHead colSpan={2} className="text-center border-b border-l">Écart</TableHead>
                            <TableHead rowSpan={2} className="text-center align-middle border-l">Écart Total</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-center">Total (U)</TableHead>
                            <TableHead className="text-center border-l">Détail</TableHead>
                            <TableHead className="text-center border-l">Total (U)</TableHead>
                            <TableHead className="text-center border-l">Détail</TableHead>
                            <TableHead className="text-center border-l">Carton</TableHead>
                            <TableHead className="text-center border-l">Unité</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.lignes.map((ligne, index) => (
                             <TableRow key={`${ligne.produitId}-${index}`}>
                                <TableCell>
                                    <div className="font-medium">{ligne.nomProduit}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{ligne.refProduit}</div>
                                </TableCell>
                                <TableCell>{ligne.lieuStockNom}</TableCell>
                                
                                {/* Avant Scan */}
                                <TableCell className="text-center font-mono">{ligne.qteAvantScanTotaleUnites}</TableCell>
                                <TableCell className="text-center border-l"><QteDisplay cartons={ligne.qteAvantScanCartons} unites={ligne.qteAvantScanUnitesRestantes} /></TableCell>

                                 {/* Scanné */}
                                <TableCell className="text-center font-mono border-l">{ligne.qteScanneTotaleUnites}</TableCell>
                                <TableCell className="text-center border-l"><QteDisplay cartons={ligne.qteScanneCartons} unites={ligne.qteScanneUnitesRestantes} /></TableCell>

                                {/* Écart */}
                                <TableCell className="text-center border-l"><EcartBadge ecart={ligne.ecartCartons} type="carton"/></TableCell>
                                <TableCell className="text-center border-l"><EcartBadge ecart={ligne.ecartUnites} type="unite"/></TableCell>
                                <TableCell className="text-center border-l"><EcartBadge ecart={ligne.ecartTotalUnites} type="total"/></TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/inventories')}>
                Retour à l'historique
            </Button>
            {!isConfirmed && (
                 <div className="flex items-center gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isConfirming}>
                                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FilePenLine className="h-4 w-4 mr-2" />}
                                {isConfirming ? "Confirmation..." : "Définir comme Nouvelle Quantité"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Définir comme premier inventaire ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action ignorera le stock précédent et définira les quantités scannées comme le nouveau stock de référence. 
                                    Ceci est utile pour un premier inventaire. L'opération est irréversible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleConfirm(true)}>
                                    Oui, définir comme nouvelle quantité
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isConfirming}>
                                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                                {isConfirming ? "Confirmation..." : "Appliquer les Écarts au Stock"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer et appliquer au stock ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action mettra définitivement à jour les niveaux de stock en fonction des écarts calculés. Cette opération est irréversible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleConfirm(false)}>
                                    Oui, appliquer les écarts
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
