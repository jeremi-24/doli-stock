
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';
import { voiceCommandExamples } from './voice-commands-data';


const InterpretCommandOutputSchema = z.object({
  intention: z
    .string()
    .describe(
      'L\'intention principale de l\'utilisateur. Doit être une des valeurs de la liste fournie.'
    ),
  page: z
    .string()
    .optional()
    .describe('Si l\'intention est de naviguer, ceci est le chemin de la page.'),
  params: z
    .any()
    .optional()
    .describe(
      'Un objet contenant les paramètres extraits de la commande, comme les noms, les dates, les quantités, etc.'
    ),
  spokenResponse: z
    .string()
    .describe(
      'Une réponse vocale amicale et concise pour confirmer l\'action ou la compréhension.'
    ),
});

export type InterpretCommandOutput = z.infer<
  typeof InterpretCommandOutputSchema
>;

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

const intentions = `
  - 'navigate': Pour se déplacer entre les pages.
  - 'get_stock', 'create_product', 'delete_product', 'search_product', 'update_product', 'print_barcodes', 'assign_category'.
  - 'create_sale', 'get_pending_sales', 'add_payment', 'cancel_sale', 'get_sales_history'.
  - 'create_order', 'validate_order', 'cancel_order', 'get_orders'.
  - 'start_inventory', 'confirm_inventory', 'get_inventory_details', 'export_inventory', 'search_inventories'.
  - 'generate_invoice', 'delete_invoice', 'generate_delivery_note', 'validate_delivery_step1', 'confirm_delivery_step2', 'get_invoices'.
  - 'create_client', 'update_client', 'delete_client', 'get_clients'.
  - 'get_users', 'create_user', 'update_user', 'delete_user', 'get_roles', 'create_role', 'update_role', 'delete_role'.
  - 'logout', 'get_notifications', 'get_logs', 'update_company_info', 'refresh_data'.
  - 'unknown': Si la commande est ambiguë ou non reconnue.
`;


export async function interpretCommand(
  commandText: string
): Promise<InterpretCommandOutput> {
  
  const systemPrompt = `
    Tu es l'assistant vocal de l'application de gestion de stock STA. Ton rôle est d'interpréter les commandes vocales des utilisateurs et de les traduire en un objet JSON structuré.

    Voici ton processus en 4 étapes :
    1.  **Analyse la commande de l'utilisateur** : ${commandText}
    2.  **Identifie l'intention** : Choisis l'intention la plus appropriée dans la liste ci-dessous. Sois flexible avec l'orthographe et les synonymes. Si un mot ressemble à un alias, fais la correspondance.
        \`\`\`
        ${intentions}
        \`\`\`
    3.  **Extrais les paramètres** : Si la commande contient des détails (noms, quantités, dates, etc.), extrais-les dans un objet \`params\`. Pour les dates, utilise des termes relatifs si possible (ex: 'aujourd'hui', 'semaine_derniere', 'mois_en_cours').
    4.  **Détermine la navigation** : Si l'intention est 'navigate', identifie la page cible à partir de la liste ci-dessous et renseigne le champ \`page\`.
        \`\`\`
        ${pages}
        \`\`\`
    5.  **Formule une réponse vocale** : Propose une réponse courte et claire pour confirmer ce que tu as compris. Si l'intention est 'unknown', demande à l'utilisateur de reformuler.

    Voici des exemples de commandes et le résultat attendu :
    ${voiceCommandExamples}

    **Important** : Réponds uniquement avec l'objet JSON. Ne rajoute aucun texte avant ou après.
  `;
  
  try {
    const {candidates} = await ai.generate({
      model: 'gemini-1.5-flash-latest',
      prompt: systemPrompt,
      output: {
        format: 'json',
        schema: InterpretCommandOutputSchema,
      },
      temperature: 0,
    });

    const output = candidates[0].output;
    if (!output) {
      throw new Error('No output from AI');
    }
    return output as InterpretCommandOutput;
    
  } catch (error) {
    console.error("Erreur lors de l'interprétation de la commande:", error);
    return {
      intention: 'unknown',
      spokenResponse: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
    };
  }
}
