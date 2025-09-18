
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, X, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimResult, setInterimResult] = useState('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Logic to start/stop listening will be added later
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-16 h-16 bg-primary/90 hover:bg-primary/100 shadow-lg"
          onClick={handleToggle}
        >
          <Mic className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-2xl transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-headline">Assistant Vocal</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggle}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex flex-col items-center justify-center text-center">
            {isListening ? (
              <>
                <Loader className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground text-sm">{interimResult || 'Je vous écoute...'}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Bonjour, dites ce que vous voulez faire.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
