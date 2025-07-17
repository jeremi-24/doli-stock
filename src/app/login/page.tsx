
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast"
import * as api from "@/lib/api"
import type { LoginPayload, CurrentUser } from "@/lib/types"
import { useApp } from "@/context/app-provider"

const loginSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse e-mail valide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useApp();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginPayload) {
    setIsLoading(true);
    try {
      const response = await api.loginUser(values);
      if (response && response.token && response.success) {
        toast({
            title: "Connexion réussie",
            description: "Vous allez être redirigé vers le tableau de bord.",
        });
        await login(response.token, null); // Pass null for profile, it will be fetched
        router.push('/');
      } else {
        throw new Error("Réponse de connexion invalide, token ou succès manquant.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

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
            <CardTitle className="text-2xl font-headline">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="m@example.com" {...field} disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center">
                          <FormLabel>Mot de passe</FormLabel>
                          <Link href="#" className="ml-auto inline-block text-sm underline">
                            Mot de passe oublié?
                          </Link>
                        </div>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Vous n'avez pas de compte?{" "}
              <Link href="/signup" className="underline">
                Créer un compte
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
