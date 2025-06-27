"use client"
import Link from "next/link"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/logo"

export default function SignupPage() {
  return (
    <div className="w-full h-screen flex lg:flex-row">
      
      <div className="hidden lg:flex flex-col lg:w-[500px] items-center justify-center bg-primary text-primary-foreground p-12 text-center">
       <Logo className="w-24 h-24 text-primary-foreground" />
       <h1 className="mt-4 text-3xl font-bold font-headline">StockHero</h1>
       <p className="mt-2 text-lg">Votre gestion de stock, simplifiée.</p>
      </div>
      
      <div className="items-center justify-center flex w-full p-6 bg-background">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader className="text-center">
            <Logo className="w-12 h-12 mx-auto mb-4 lg:hidden" />
            <CardTitle className="text-2xl font-headline">Créer un compte</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour vous inscrire
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
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" required />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="role">Rôle</Label>
                <Select>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="USER">Utilisateur</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Créer le compte
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
                Vous avez déjà un compte?{" "}
                <Link href="/login" className="underline">
                    Se connecter
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
