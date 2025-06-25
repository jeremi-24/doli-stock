
"use client";

import React, { useMemo } from 'react';
import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from 'lucide-react';

export default function CategoriesPage() {
    const { products } = useApp();

    const categoryData = useMemo(() => {
        const categories: { [key: string]: { count: number; stock: number } } = {};
        products.forEach(product => {
            if (!categories[product.category]) {
                categories[product.category] = { count: 0, stock: 0 };
            }
            categories[product.category].count += 1;
            categories[product.category].stock += product.quantity;
        });
        return Object.entries(categories)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-semibold">Catégories de Produits</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Tag /> Vos Catégories</CardTitle>
          <CardDescription>
            Voici la liste de toutes les catégories de produits basées sur votre inventaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la Catégorie</TableHead>
                  <TableHead className="text-right">Produits Uniques</TableHead>
                  <TableHead className="text-right">Quantité Totale en Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.length > 0 ? (
                  categoryData.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">{category.count}</TableCell>
                      <TableCell className="text-right">{category.stock} unités</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Aucune catégorie trouvée. Ajoutez des produits avec des catégories pour les voir ici.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
