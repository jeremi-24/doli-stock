
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Commande } from '@/lib/types';
import { X } from 'lucide-react';
import { OrderTemplate } from './order-template';

export function OrderPreviewDialog({
  isOpen,
  onOpenChange,
  commande,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  commande: Commande | null;
}) {
  
  if (!commande) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Détails de la Commande</DialogTitle>
          <DialogDescription>
            Aperçu de la commande N°{String(commande.id).padStart(5, '0')}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 min-h-0">
          <ScrollArea className="h-full bg-muted/50 rounded-md border">
            <div className="p-4">
              <OrderTemplate commande={commande} />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
