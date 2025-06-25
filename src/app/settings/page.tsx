"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/app-provider";
import { useToast } from "@/hooks/use-toast";
import { Settings, Barcode, Warehouse, FileText, ShoppingCart } from 'lucide-react';

export default function SettingsPage() {
  const { activeModules, setActiveModules } = useApp();
  const { toast } = useToast();

  const handleModuleToggle = (module: keyof typeof activeModules) => {
    setActiveModules(prev => {
      const newState = { ...prev, [module]: !prev[module] };
      toast({
        title: "Settings Updated",
        description: `The ${module} module has been ${newState[module] ? 'enabled' : 'disabled'}.`,
      });
      return newState;
    });
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Module Management
          </CardTitle>
          <CardDescription>Enable or disable modules to customize your workflow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <Warehouse className="h-6 w-6 mt-1 text-primary"/>
              <div>
                <Label htmlFor="stock-module" className="font-semibold text-base">Stock Management</Label>
                <p className="text-sm text-muted-foreground">
                  Track product quantities, prices, and categories. Required for other modules.
                </p>
              </div>
            </div>
            <Switch
              id="stock-module"
              checked={activeModules.stock}
              onCheckedChange={() => handleModuleToggle('stock')}
              disabled
            />
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
               <FileText className="h-6 w-6 mt-1 text-primary"/>
              <div>
                <Label htmlFor="invoicing-module" className="font-semibold text-base">Invoicing</Label>
                <p className="text-sm text-muted-foreground">
                  Create and manage simple invoices for customers.
                </p>
              </div>
            </div>
            <Switch
              id="invoicing-module"
              checked={activeModules.invoicing}
              onCheckedChange={() => handleModuleToggle('invoicing')}
            />
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
               <ShoppingCart className="h-6 w-6 mt-1 text-primary"/>
              <div>
                <Label htmlFor="pos-module" className="font-semibold text-base">Point of Sale</Label>
                <p className="text-sm text-muted-foreground">
                  A streamlined interface for quick in-person sales.
                </p>
              </div>
            </div>
            <Switch
              id="pos-module"
              checked={activeModules.pos}
              onCheckedChange={() => handleModuleToggle('pos')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
                <Barcode className="h-6 w-6 mt-1 text-primary"/>
              <div>
                <Label htmlFor="barcode-module" className="font-semibold text-base">Barcode Scanner</Label>
                <p className="text-sm text-muted-foreground">
                  Use the dashboard to quickly look up products by barcode.
                </p>
              </div>
            </div>
            <Switch
              id="barcode-module"
              checked={activeModules.barcode}
              onCheckedChange={() => handleModuleToggle('barcode')}
            />
          </div>

        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Changes are saved automatically. Some features may require a page reload to apply.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
