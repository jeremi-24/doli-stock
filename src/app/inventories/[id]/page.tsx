
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Check, X, Minus, MoveRight, Package as UnitIcon, Box } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Inventaire, InventaireLigne } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [inventory, setInventory] = useState<Inventaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
        async function fetchInventory() {
            try {
                setIsLoading(true);
                const data = await api.getInventaire(Number(id));
                setInventory(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger l'inventaire: ${errorMessage}` });
                router.push('/inventories');
            } finally {
                setIsLoading(false);
            }
        }
        fetchInventory();
    }
  }, [id, router, toast]);

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
    <div className="flex items-center justify-center gap-2 text-xs">
        {cartons > 0 && <span className="flex items-center gap-1"><Box className="h-3 w-3" />{cartons} C</span>}
        {unites > 0 && <span className="flex items-center gap-1"><UnitIcon className="h-3 w-3" />{unites} U</span>}
        {(cartons === 0 && unites === 0) && '0'}
    </div>
  )


  if (isLoading || !inventory) {
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
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Inventaire N° INV-{String(inventory.inventaireId).padStart(5, '0')}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4"/> Chargé de l'inventaire: <span className="font-medium text-foreground">{inventory.charge}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Date: <span className="font-medium text-foreground">{format(new Date(inventory.date), 'd MMMM yyyy à HH:mm', { locale: fr })}</span></div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
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
                                <TableCell className="font-medium">{ligne.nomProduit}</TableCell>
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
        <CardFooter>
            <Button onClick={() => router.push('/inventories')}>
                Retour à l'historique
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
