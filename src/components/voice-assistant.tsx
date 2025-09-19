
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, X, Loader, CornerDownLeft, Sparkles, Wand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { interpretCommand, type InterpretCommandOutput } from '@/ai/flows/interpret-command-flow';
import * as api from '@/lib/api';
import { useApp } from '@/context/app-provider';
import type { Vente } from '@/lib/types';
import { format, parseISO } from 'date-fns';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimResult, setInterimResult] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { addClient, deleteClient, clients } = useApp();

  const handleGetSalesHistory = async (params: any) => {
    try {
        if (params?.dateDebut && params?.dateFin) {
            const sales: Vente[] = await api.getVentesByPeriode(params.dateDebut, params.dateFin);
            const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
            const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

            toast({
                title: `Résultat de la recherche`,
                description: `J'ai trouvé ${sales.length} ventes pour un total de ${formatCurrency(totalSales)} entre le ${format(parseISO(params.dateDebut), 'd MMM')} et le ${format(parseISO(params.dateFin), 'd MMM')}.`,
            });
            
            router.push(`/sales?from=${params.dateDebut}&to=${params.dateFin}`);
            handleTogglePanel();
        } else {
             router.push('/sales');
             handleTogglePanel();
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique des ventes", error);
        toast({
            variant: "destructive",
            title: "Erreur API",
            description: "Impossible de récupérer l'historique des ventes.",
        });
    }
  };

   const handleGetVentesCredit = async () => {
    try {
      const sales: Vente[] = await api.getVentesCreditEnCours();
      const totalCredit = sales.reduce((sum, sale) => sum + sale.soldeRestant, 0);
      const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);

      toast({
        title: "Crédits en cours",
        description: `Il y a ${sales.length} crédit(s) en cours pour un total de ${formatCurrency(totalCredit)}.`,
      });

      router.push('/sales?credits=true');
      handleTogglePanel();
    } catch (error) {
      console.error("Erreur lors de la récupération des crédits", error);
      toast({
        variant: "destructive",
        title: "Erreur API",
        description: "Impossible de récupérer les crédits en cours.",
      });
    }
  };
  
  const processCommand = async (commandText: string) => {
    if (!commandText) return;
    setIsProcessing(true);

    try {
      const result = await interpretCommand(commandText);
      console.log("Interpreted Command: ", result);
      
      toast({
          title: "Commande interprétée",
          description: result.spokenResponse,
      });

      switch (result.intention) {
        case 'navigate':
          if (result.page) {
              router.push(result.page);
              handleTogglePanel();
          }
          break;
        case 'get_sales_history':
            handleGetSalesHistory(result.params);
            break;
        case 'get_pending_sales':
            handleGetVentesCredit();
            break;
        default:
            console.log("Intention non gérée :", result.intention, result.params);
      }
      
    } catch (error) {
      console.error("Error interpreting command:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'interprétation",
        description: "Je n'ai pas pu traiter votre demande.",
      });
    } finally {
      setIsProcessing(false);
      setFinalResult('');
      setInterimResult('');
    }
  };


  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      setInterimResult('');
      setFinalResult('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      setInterimResult(interim);
      if (final) {
        setFinalResult(final.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          variant: "destructive",
          title: "Erreur de l'assistant vocal",
          description: "La reconnaissance vocale a échoué. Veuillez réessayer.",
        });
        console.error('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [toast]);
  
  useEffect(() => {
    if (finalResult && !isProcessing) {
      processCommand(finalResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalResult, isProcessing]);

  const handleTogglePanel = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsOpen(!isOpen);
    setInterimResult('');
    setFinalResult('');
    setIsProcessing(false);
  };

  const handleListen = () => {
    if (isListening || !recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (error) {
       console.error("Could not start speech recognition:", error);
       toast({
          variant: "destructive",
          title: "Erreur de microphone",
          description: "Impossible de démarrer l'écoute. Vérifiez les permissions de votre microphone.",
        });
    }
  };

  const currentText = isProcessing ? 'Analyse en cours...' : (finalResult || interimResult);
  const displayText = currentText || (isListening ? "Je vous écoute..." : "Bonjour, que puis-je faire ?");


  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-16 h-16 bg-primary/90 hover:bg-primary/100 shadow-lg animate-pulse"
          onClick={handleTogglePanel}
        >
          <Sparkles className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="w-80 shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-headline flex items-center gap-2"><Wand className="h-5 w-5"/>Assistant Vocal</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleTogglePanel}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-24 flex items-center justify-center">
                <p className={cn("text-lg font-medium", !currentText && "text-muted-foreground")}>{displayText}</p>
              </div>
              <Button
                  size="icon"
                  className={cn("rounded-full w-16 h-16 transition-all duration-300", (isListening || isProcessing) && "bg-destructive hover:bg-destructive/90 scale-110")}
                  onClick={handleListen}
                  disabled={!recognitionRef.current || isProcessing}
                >
                  {isProcessing ? <Loader className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
                </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

    