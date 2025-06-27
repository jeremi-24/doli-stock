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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast"
import * as api from "@/lib/api"
import type { SignupPayload } from "@/lib/types"

const signupSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'USER'], { required_error: "Veuillez sélectionner un rôle." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupPayload) {
    setIsLoading(true);
    try {
      await api.signupUser(values);
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
      });
      router.push("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
      toast({
        variant: "destructive",
        title: "Échec de l'inscription",
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
            <CardTitle className="text-2xl font-headline">Créer un compte</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour vous inscrire
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
                        <FormControl><Input placeholder="m@example.com" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl><Input type="password" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le mot de passe</FormLabel>
                        <FormControl><Input type="password" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rôle</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="USER">Utilisateur</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Création..." : "Créer le compte"}
                </Button>
              </form>
            </Form>
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
