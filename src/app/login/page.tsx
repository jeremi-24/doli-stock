"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  return (
    <div className="w-full h-screen grid lg:grid-cols-2">
      
      <div className="hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-12 text-center">
       <Logo className="w-24 h-24 text-primary-foreground" />
       <h1 className="mt-4 text-3xl font-bold font-headline">StockHero</h1>
       <p className="mt-2 text-lg">Votre gestion de stock, simplifiée.</p>
      </div>
      
      {/* Right panel with login form */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader className="text-center">
            <Logo className="w-12 h-12 mx-auto mb-4 lg:hidden" />
            <CardTitle className="text-2xl font-headline">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a href="#" className="ml-auto inline-block text-sm underline">
                    Mot de passe oublié?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
