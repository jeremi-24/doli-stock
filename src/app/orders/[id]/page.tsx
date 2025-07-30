
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, Loader2, AlertTriangle } from 'lucide-react';
import type { Facture, BonLivraison, ShopInfo, Commande } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvoiceTemplate } from '@/components/invoice-template';
import { DeliverySlipTemplate } from '@/components/delivery-slip-template';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '@/context/app-provider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function DocumentViewer() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { shopInfo, commandes, factures, bonLivraisons, isMounted } = useApp();

    const [commande, setCommande] = useState<Commande | null | undefined>(undefined);
    const [facture, setFacture] = useState<Facture | null | undefined>(undefined);
    const [bonLivraison, setBonLivraison] = useState<BonLivraison | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);

    const invoiceRef = useRef<HTMLDivElement>(null);
    const deliverySlipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isMounted) {
        const commandeId = Number(id);
        const foundCommande = commandes.find(c => c.id === commandeId);
        const foundFacture = factures.find(f => f.commandeId === commandeId);
        const foundBonLivraison = bonLivraisons.find(bl => bl.commandeId === commandeId);
        
        setCommande(foundCommande);
        setFacture(foundFacture);
        setBonLivraison(foundBonLivraison);
        setIsLoading(false);
      }
    }, [id, isMounted, commandes, factures, bonLivraisons]);

    const handlePrint = async (elementRef: React.RefObject<HTMLDivElement>, documentTitle: string) => {
        if (!elementRef.current) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le contenu à imprimer n\'est pas disponible.' });
            return;
        }

        setIsPrinting(true);
        try {
            const canvas = await html2canvas(elementRef.current, {
                scale: 2, // Améliore la qualité de l'image
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            
            // Dimensions A4 en mm: 210 x 297
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            let finalImgWidth = pdfWidth;
            let finalImgHeight = pdfWidth / ratio;
            
            if (finalImgHeight > pdfHeight) {
                finalImgHeight = pdfHeight;
                finalImgWidth = pdfHeight * ratio;
            }

            const x = (pdfWidth - finalImgWidth) / 2;
            const y = (pdfHeight - finalImgHeight) / 2;

            pdf.addImage(imgData, 'PNG', x > 0 ? x : 0, y > 0 ? y : 0, finalImgWidth, finalImgHeight);
            pdf.save(`${documentTitle}.pdf`);
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur d\'impression', description: 'Une erreur est survenue lors de la génération du PDF.' });
        } finally {
            setIsPrinting(false);
        }
    };
    
    const handlePrintAll = async () => {
        if (invoiceRef.current) await handlePrint(invoiceRef, `Facture-${facture?.idFacture || id}`);
        if (deliverySlipRef.current) await handlePrint(deliverySlipRef, `BL-${bonLivraison?.id || id}`);
    }


    if (isLoading || !isMounted) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[70vh] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[70vh] w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }

    if (!commande || !facture || !bonLivraison) {
      return (
         <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-8">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Documents introuvables</AlertTitle>
                <AlertDescription>
                    Les documents pour cette commande n'ont pas pu être chargés. Ils sont peut-être encore en cours de génération ou une erreur est survenue.
                </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retourner aux commandes
            </Button>
          </div>
      )
    }
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/orders')}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Retour</span>
                    </Button>
                    <div>
                        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                            Documents pour la Commande N°{commande.id}
                        </h1>
                        <p className="text-sm text-muted-foreground">Client: {facture.clientNom}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handlePrint(invoiceRef, `Facture-${facture?.idFacture || id}`)} disabled={isPrinting}>
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Printer className="h-4 w-4 mr-2" />} Imprimer Facture
                    </Button>
                    <Button variant="outline" onClick={() => handlePrint(deliverySlipRef, `BL-${bonLivraison?.id || id}`)} disabled={isPrinting}>
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Printer className="h-4 w-4 mr-2" />} Imprimer BL
                    </Button>
                    <Button onClick={handlePrintAll} disabled={isPrinting}>
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Printer className="h-4 w-4 mr-2" />} Imprimer Tout
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
                 {/* Invoice Column */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Facture N°{facture.idFacture}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[70vh] bg-muted/50 rounded-md border p-4">
                             <InvoiceTemplate ref={invoiceRef} facture={facture} shopInfo={shopInfo} />
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Delivery Slip Column */}
                 <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Bon de Livraison N°{bonLivraison.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[70vh] bg-muted/50 rounded-md border p-4">
                            <DeliverySlipTemplate ref={deliverySlipRef} bonLivraison={bonLivraison} facture={facture} shopInfo={shopInfo} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default DocumentViewer;
