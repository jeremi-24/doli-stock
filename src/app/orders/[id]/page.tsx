
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import type { ValidationCommandeResponse, Facture, BonLivraison, ShopInfo } from '@/lib/types';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvoiceTemplate } from '@/components/invoice-template';
import { DeliverySlipTemplate } from '@/components/delivery-slip-template';
import { useReactToPrint } from 'react-to-print';
import { useApp } from '@/context/app-provider';

function DocumentViewer() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { shopInfo } = useApp();

    const [documents, setDocuments] = useState<ValidationCommandeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const invoiceRef = useRef<HTMLDivElement>(null);
    const deliverySlipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            async function fetchDocuments() {
                try {
                    setIsLoading(true);
                    const data = await api.getDocumentsByCommandeId(Number(id));
                    setDocuments(data);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
                    toast({ variant: 'destructive', title: 'Erreur', description: `Impossible de charger les documents: ${errorMessage}` });
                    router.push('/orders');
                } finally {
                    setIsLoading(false);
                }
            }
            fetchDocuments();
        }
    }, [id, router, toast]);

    const handlePrintInvoice = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `Facture-${documents?.facture.idFacture || id}`,
    });

    const handlePrintSlip = useReactToPrint({
        content: () => deliverySlipRef.current,
        documentTitle: `BL-${documents?.bonLivraison.id || id}`,
    });
    
    const handlePrintAll = () => {
        handlePrintInvoice();
        handlePrintSlip();
    }

    if (isLoading || !documents) {
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
                            Documents pour la Commande N°{documents.commande.id}
                        </h1>
                        <p className="text-sm text-muted-foreground">Client: {documents.facture.clientNom}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrintInvoice}><Printer className="h-4 w-4 mr-2" /> Imprimer Facture</Button>
                    <Button variant="outline" onClick={handlePrintSlip}><Printer className="h-4 w-4 mr-2" /> Imprimer BL</Button>
                    <Button onClick={handlePrintAll}><Printer className="h-4 w-4 mr-2" /> Imprimer Tout</Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
                 {/* Invoice Column */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Facture N°{documents.facture.idFacture}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[70vh] bg-muted/50 rounded-md border p-4">
                             <InvoiceTemplate ref={invoiceRef} facture={documents.facture} shopInfo={shopInfo} />
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Delivery Slip Column */}
                 <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Bon de Livraison N°{documents.bonLivraison.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[70vh] bg-muted/50 rounded-md border p-4">
                            <DeliverySlipTemplate ref={deliverySlipRef} bonLivraison={documents.bonLivraison} facture={documents.facture} shopInfo={shopInfo} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default DocumentViewer;
