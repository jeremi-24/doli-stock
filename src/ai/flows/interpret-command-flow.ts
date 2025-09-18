
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { voiceCommandExamples } from './voice-commands-data';

// Schéma de sortie attendu
const InterpretCommandOutputSchema = z.object({
  intention: z.string(),
  page: z.string().optional(),
  params: z.any().optional(),
  spokenResponse: z.string(),
});

export type InterpretCommandOutput = z.infer<typeof InterpretCommandOutputSchema>;

// Liste des pages et alias
const pages = `
- 'dashboard' (alias: accueil, tableau de bord, page d'accueil), path: '/'
- 'stock' (alias: stock, état du stock, inventaire), path: '/stock'
- 'products' (alias: produits, produit, articles, catalogue), path: '/products'
- 'orders' (alias: commandes, commande, bons de commande), path: '/orders'
- 'invoicing' (alias: factures, facturation), path: '/invoicing'
- 'invoice-templates' (alias: modèles de facture, modèle), path: '/invoice-templates'
- 'deliveries' (alias: livraisons, bons de livraison), path: '/deliveries'
- 'sales' (alias: ventes, historique des ventes), path: '/sales'
- 'categories' (alias: catégories, catégorie), path: '/categories'
- 'entrepots' (alias: entrepôts, lieu de stock, lieux), path: '/entrepots'
- 'clients' (alias: clients, client), path: '/clients'
- 'inventories' (alias: inventaires), path: '/inventories/new'
- 'reapprovisionnements' (alias: réapprovisionnements, arrivages), path: '/reapprovisionnements/new'
- 'pos' (alias: point de vente, caisse), path: '/pos'
- 'logs' (alias: logs, journal, historique des actions), path: '/logs'
- 'settings' (alias: paramètres, réglages, administration), path: '/settings'
- 'help' (alias: aide, mode d'emploi), path: '/mode-d-emploi'
`;

// Liste des intentions
const intentions = `
- 'navigate'
- 'get_stock'
- 'create_product'
- 'delete_product'
- 'search_product'
- 'update_product'
- 'print_barcodes'
- 'assign_category'
- 'create_sale'
- 'get_pending_sales'
- 'add_payment'
- 'cancel_sale'
- 'get_sales_history'
- 'create_order'
- 'validate_order'
- 'cancel_order'
- 'get_orders'
- 'start_inventory'
- 'confirm_inventory'
- 'get_inventory_details'
- 'export_inventory'
- 'search_inventories'
- 'generate_invoice'
- 'delete_invoice'
- 'generate_delivery_note'
- 'validate_delivery_step1'
- 'confirm_delivery_step2'
- 'get_invoices'
- 'create_client'
- 'update_client'
- 'delete_client'
- 'get_clients'
- 'get_users'
- 'create_user'
- 'update_user'
- 'delete_user'
- 'get_roles'
- 'create_role'
- 'update_role'
- 'delete_role'
- 'logout'
- 'get_notifications'
- 'get_logs'
- 'update_company_info'
- 'refresh_data'
- 'unknown'
`;

const interpretCommandPrompt = ai.definePrompt({
    name: 'interpretCommandPrompt',
    input: { schema: z.object({ commandText: z.string() }) },
    output: { schema: InterpretCommandOutputSchema },
    prompt: `
        Tu es l'assistant vocal de l'application STA. Ton rôle est d'interpréter les commandes vocales des utilisateurs et de les convertir en JSON.

        Commande utilisateur : "{{commandText}}"

        Sois flexible avec l'orthographe. Si un mot dans la commande de l'utilisateur ressemble fortement à un alias ou à un nom de page (par exemple, à cause d'une faute de frappe), fais la correspondance avec le terme le plus proche.

        Intentions possibles :
        ${intentions}

        Pages disponibles :
        ${pages}

        Exemples de commandes et résultats :
        ${voiceCommandExamples}

        Réponds uniquement avec un JSON valide correspondant au schéma de sortie.
    `,
});


export async function interpretCommand(
  commandText: string
): Promise<InterpretCommandOutput> {

  try {
    const { output } = await interpretCommandPrompt({ commandText });
    
    if (!output) {
      throw new Error("La sortie du modèle est vide.");
    }
    
    return output;
  } catch (error) {
    console.error(
      'Erreur lors de l’interprétation de la commande :',
      error instanceof Error ? error.message : error
    );

    return {
      intention: 'unknown',
      spokenResponse: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
    };
  }
}
