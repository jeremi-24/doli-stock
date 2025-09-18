
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, X, Loader, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimResult, setInterimResult] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

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
      setFinalResult(final.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
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
      // Here you would process the finalResult
    };

    recognitionRef.current = recognition;
  }, [toast]);

  const handleTogglePanel = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsOpen(!isOpen);
    setInterimResult('');
    setFinalResult('');
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

  const currentText = finalResult || interimResult;

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-16 h-16 bg-primary/90 hover:bg-primary/100 shadow-lg"
          onClick={handleTogglePanel}
        >
          <Mic className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="w-80 shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-headline">Assistant Vocal</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleTogglePanel}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-24 flex items-center justify-center">
                {currentText ? (
                    <p className="text-lg font-medium">{currentText}</p>
                ) : (
                    <p className="text-muted-foreground">{isListening ? "Je vous écoute..." : "Bonjour, que puis-je faire ?"}</p>
                )}
              </div>
              <Button
                  size="icon"
                  className={cn("rounded-full w-16 h-16 transition-all duration-300", isListening && "bg-destructive hover:bg-destructive/90 scale-110")}
                  onClick={handleListen}
                  disabled={!recognitionRef.current}
                >
                  {isListening ? <Loader className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
                </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
