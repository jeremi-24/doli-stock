
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Check, X, MoveRight, Package as UnitIcon, Box, Loader2, FileUp, AlertTriangle, CheckCircle, FilePenLine, Save, Minus, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Inventaire, InventaireLigne, InventairePayload, InventaireLignePayload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as api from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirmInventaire, isMounted, updateInventaire, currentUser, produits } = useApp();
  
  const [inventory, setInventory] = useState<Inventaire | null | undefined>(undefined);
  const [editableLines, setEditableLines] = useState<InventaireLigne[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const productMap = useMemo(() => new Map(produits.map(p => [p.id, p])), [produits]);

  const fetchInventory = useCallback(async () => {
    if (!isMounted) return;
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
        if (data?.lignes) {
            setEditableLines(JSON.parse(JSON.stringify(data.lignes))); // Deep copy
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger l'inventaire: ${errorMessage}` });
        router.push('/inventories');
    } finally {
        setIsLoading(false);
    }
  }, [id, router, toast, isMounted]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  
  const handleQuantityChange = (produitId: number, field: 'qteScanneCartons' | 'qteScanneUnitesRestantes', value: number) => {
    setEditableLines(prevLines =>
        prevLines.map(line =>
            line.produitId === produitId ? { ...line, [field]: Math.max(0, value) } : line
        )
    );
  };

  const handleSave = async () => {
    if (!inventory || !currentUser) return;
    setIsSaving(true);
    
    const payloadLignes: InventaireLignePayload[] = editableLines.map(line => {
      const produit = productMap.get(line.produitId);
      const qteParCarton = produit?.qteParCarton || 1;
      const qteScanne = line.qteScanneCartons * qteParCarton + line.qteScanneUnitesRestantes;
      
      return {
        produitId: line.produitId,
        ref: line.ref,
        qteScanne: qteScanne,
        // Ces champs sont requis par le payload mais le recalcul se fera côté backend
        lieuStockId: inventory.lieuStockId,
        typeQuantiteScanne: 'UNITE', // Le backend s'attend à une valeur, même si elle est recalculée
      };
    });

    const payload: InventairePayload = {
      charge: currentUser.email,
      lieuStockId: inventory.lieuStockId,
      produits: payloadLignes,
    };
    
    try {
        const updatedInventory = await updateInventaire(inventory.id, payload);
        if (updatedInventory) {
            setInventory(updatedInventory);
            setEditableLines(JSON.parse(JSON.stringify(updatedInventory.lignes)));
            toast({ title: 'Inventaire mis à jour', description: 'Les écarts ont été recalculés.' });
            setIsEditMode(false);
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleConfirm = async (isPremier: boolean) => {
      if (!inventory) return;
      setIsConfirming(true);
      try {
          const result = await confirmInventaire(inventory.id, isPremier);
          if(result) {
            setInventory(result);
            setEditableLines(JSON.parse(JSON.stringify(result.lignes)));
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
  const canEdit = !isConfirmed && !isSaving;

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
                <CheckCircle className="h-4 w-4"/> Confirmé
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-orange-500 text-white gap-2">
                <AlertTriangle className="h-4 w-4"/> En attente
            </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {canEdit && !isEditMode && (
            <Button size="sm" className="border-black"  variant="outline" onClick={() => setIsEditMode(true)}>
              <FilePenLine className="h-4 w-4 mr-2" /> Modifier
            </Button>
          )}
        </div>
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
                            <TableHead colSpan={2} className="text-center border-b border-l">Avant Scan</TableHead>
                            <TableHead colSpan={2} className="text-center border-b border-l">Quantité Scannée</TableHead>
                            <TableHead colSpan={2} className="text-center border-b border-l">Écart</TableHead>
                            <TableHead rowSpan={2} className="text-center align-middle border-l">Écart Total</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-center">Total (U)</TableHead>
                            <TableHead className="text-center border-l">Détail</TableHead>
                            <TableHead className="text-center border-l">Carton</TableHead>
                            <TableHead className="text-center border-l">Unité</TableHead>
                            <TableHead className="text-center border-l">Carton</TableHead>
                            <TableHead className="text-center border-l">Unité</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {editableLines.map((ligne, index) => {
                            const originalLigne = inventory.lignes.find(l => l.produitId === ligne.produitId)!;
                             return (
                             <TableRow key={`${ligne.produitId}-${index}`}>
                                <TableCell>
                                    <div className="font-medium">{ligne.ref}</div>
                                    <div className="text-xs  font-medium">{ligne.nomProduit}</div>
                                </TableCell>
                                <TableCell>{ligne.lieuStockNom}</TableCell>
                                
                                {/* Avant Scan */}
                                <TableCell className="text-center font-mono">{originalLigne.qteAvantScanTotaleUnites}</TableCell>
                                <TableCell className="text-center border-l"><QteDisplay cartons={originalLigne.qteAvantScanCartons} unites={originalLigne.qteAvantScanUnitesRestantes} /></TableCell>

                                 {/* Scanné */}
                                <TableCell className="text-center font-mono border-l">
                                  {isEditMode ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(ligne.produitId, 'qteScanneCartons', ligne.qteScanneCartons - 1)}><Minus className="h-3 w-3"/></Button>
                                      <Input type="number" value={ligne.qteScanneCartons} onChange={e => handleQuantityChange(ligne.produitId, 'qteScanneCartons', parseInt(e.target.value, 10) || 0)} className="h-8 w-14 text-center"/>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(ligne.produitId, 'qteScanneCartons', ligne.qteScanneCartons + 1)}><Plus className="h-3 w-3"/></Button>
                                    </div>
                                  ) : (
                                    <span>{originalLigne.qteScanneCartons}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center border-l">
                                   {isEditMode ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(ligne.produitId, 'qteScanneUnitesRestantes', ligne.qteScanneUnitesRestantes - 1)}><Minus className="h-3 w-3"/></Button>
                                        <Input type="number" value={ligne.qteScanneUnitesRestantes} onChange={e => handleQuantityChange(ligne.produitId, 'qteScanneUnitesRestantes', parseInt(e.target.value, 10) || 0)} className="h-8 w-14 text-center"/>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(ligne.produitId, 'qteScanneUnitesRestantes', ligne.qteScanneUnitesRestantes + 1)}><Plus className="h-3 w-3"/></Button>
                                      </div>
                                    ) : (
                                      <span>{originalLigne.qteScanneUnitesRestantes}</span>
                                    )}
                                </TableCell>

                                {/* Écart */}
                                <TableCell className="text-center border-l"><EcartBadge ecart={originalLigne.ecartCartons} type="carton"/></TableCell>
                                <TableCell className="text-center border-l"><EcartBadge ecart={originalLigne.ecartUnites} type="unite"/></TableCell>
                                <TableCell className="text-center border-l"><EcartBadge ecart={originalLigne.ecartTotalUnites} type="total"/></TableCell>
                             </TableRow>
                             )
                        })}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/inventories')}>
                Retour à l'historique
            </Button>
            {isEditMode ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setIsEditMode(false); setEditableLines(JSON.parse(JSON.stringify(inventory.lignes))); }}>Annuler</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                  {isSaving ? "Enregistrement..." : "Recalculer et Enregistrer"}
                </Button>
              </div>
            ) : canEdit && (
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
