
import type { Categorie, Produit, LieuStock, AssignationPayload, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Client, ShopInfo, Role, Utilisateur, CommandePayload, Commande, Facture, BonLivraison, RoleCreationPayload, CurrentUser, ValidationCommandeResponse } from './types';

const API_BASE_URL = '/api'; 

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('stockhero_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = buildHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
            const errorBody = await response.json();
            // Prioritize server's error message
            errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
            // Fallback to status text if no JSON body
             errorMessage = response.statusText;
        }
        throw new ApiError(errorMessage, response.status);
    }
    
    const newTokenHeader = response.headers.get('Authorization');
    if (newTokenHeader && newTokenHeader.startsWith('Bearer ')) {
      const newToken = newTokenHeader.substring(7);
      if (typeof window !== 'undefined') {
        localStorage.setItem('stockhero_token', newToken);
      }
    }

    if (options.headers?.['Accept'] === 'application/pdf' || response.headers.get('Content-Type')?.includes('application/pdf')) {
        return response.blob();
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn(`API response for ${endpoint} was successful but not valid JSON. Response body: "${text}"`);
      return null;
    }

  } catch (error) {
    if (error instanceof ApiError) {
        throw error;
    }
    
    if (error instanceof TypeError) {
      const networkErrorMessage = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et que le service est bien en ligne.';
      throw new ApiError(networkErrorMessage, 0);
    }

    throw error;
  }
}

// ========== Auth API ==========
export async function loginUser(data: LoginPayload): Promise<any> {
  return apiFetch('/users/login', { method: 'POST', body: JSON.stringify(data) });
}
export async function registerUser(data: SignupPayload): Promise<any> {
  const { confirmPassword, ...payload } = data;
  return apiFetch('/users/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMe(): Promise<CurrentUser> {
    return apiFetch('/users/me');
}


// ========== Users & Roles API ==========
export async function getUsers(): Promise<Utilisateur[]> { return apiFetch('/users'); }
export async function createUser(data: any): Promise<any> {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}
export async function getRoles(): Promise<Role[]> { return apiFetch('/roles'); }
export async function getRoleById(id: number): Promise<Role> { return apiFetch(`/roles/${id}`); }
export async function createRole(data: RoleCreationPayload): Promise<Role> { 
    return apiFetch('/roles', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateRole(id: number, data: RoleCreationPayload): Promise<Role> {
    return apiFetch(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteRole(id: number): Promise<null> {
    return apiFetch(`/roles/${id}`, { method: 'DELETE' });
}


// ========== Organisation API ==========
export async function getOrganisations(): Promise<ShopInfo[]> {
    return apiFetch('/organisations');
}
export async function saveOrganisation(data: Partial<ShopInfo>): Promise<ShopInfo> {
    return apiFetch('/organisations', { method: 'POST', body: JSON.stringify(data) });
}

// ========== Clients API ==========
export async function getClients(): Promise<Client[]> { return apiFetch('/clients'); }
export async function getAllClients(): Promise<Client[]> { return apiFetch('/clients/all'); }
export async function createClient(data: Omit<Client, 'id'>): Promise<Client> {
  return apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  return apiFetch(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteClient(id: number): Promise<null> {
  return apiFetch(`/clients/${id}`, { method: 'DELETE' });
}

// ========== Categories API ==========
export async function getCategories(): Promise<Categorie[]> { return apiFetch('/categorie'); };
export async function getCategoryIdByName(nom: string): Promise<number> { return apiFetch(`/categorie/id?nom=${encodeURIComponent(nom)}`); };
export async function createCategory(data: { nom: string }): Promise<Categorie> {
  const body = { nom: data.nom };
  return apiFetch('/categorie', { method: 'POST', body: JSON.stringify(body) });
};
export async function updateCategory(id: number, data: Partial<Categorie>): Promise<Categorie> {
  const body = { ...data, id };
  return apiFetch(`/categorie/${id}`, { method: 'PUT', body: JSON.stringify(body) });
};
export async function deleteCategories(ids: number[]): Promise<null> {
  return apiFetch(`/categorie`, { method: 'DELETE', body: JSON.stringify(ids) });
};

// ========== Lieux de Stock API ==========
export async function getLieuxStock(): Promise<LieuStock[]> { return apiFetch('/lieustock'); };
export async function getLieuStockIdByName(nom: string): Promise<number> { return apiFetch(`/lieustock/id?nom=${encodeURIComponent(nom)}`); };
export async function createLieuStock(data: { nom: string, type: string, localisation?: string }): Promise<LieuStock> {
  return apiFetch('/lieustock', { method: 'POST', body: JSON.stringify(data) });
};
export async function updateLieuStock(id: number, data: Partial<LieuStock>): Promise<LieuStock> {
  const body = { ...data, id };
  return apiFetch(`/lieustock/${id}`, { method: 'PUT', body: JSON.stringify(body) });
};
export async function deleteLieuxStock(ids: number[]): Promise<null> {
  return apiFetch(`/lieustock`, { method: 'DELETE', body: JSON.stringify(ids) });
};

// ========== Products API ==========
export async function getProducts(): Promise<Produit[]> {
    return apiFetch(`/produits`);
}
export async function getProductByBarcode(codeBarre: string): Promise<Produit | null> {
    return apiFetch(`/produits/code/${codeBarre}`);
}
export async function createProduct(data: any): Promise<any> {
  return apiFetch('/produits', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateProduct(id: number, data: Partial<any>): Promise<any> {
  const body = { ...data, id };
  return apiFetch(`/produits/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}
export async function deleteProducts(ids: number[]): Promise<null> {
  return apiFetch(`/produits`, { method: 'DELETE', body: JSON.stringify(ids) });
}
export async function assignProducts(data: AssignationPayload): Promise<null> {
    const payload = {
        produitIds: data.produitIds,
        ...(data.categorieId && { categorieId: data.categorieId }),
        ...(data.lieuStockId && { lieuStockId: data.lieuStockId }),
    };
  return apiFetch(`/produits/assignation`, { method: 'PUT', body: JSON.stringify(payload) });
};

export async function importProducts(file: File): Promise<Produit[]> {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('stockhero_token') : null;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/produits/import`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Échec de l'importation: ${errorBody}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Erreur de connexion API pour importProducts:', { error });
    throw error;
  }
};
export async function printBarcodes(data: { produitNom: string, quantite: number }): Promise<Blob> {
    return apiFetch('/barcode/print', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Accept': 'application/pdf' },
    });
}

// ========== Ventes (POS) API ==========
export async function createVente(data: any): Promise<any> {
    return apiFetch('/ventes', { method: 'POST', body: JSON.stringify(data) });
}

// ========== Inventaires API ==========
export async function getInventaires(): Promise<Inventaire[]> {
  return apiFetch('/inventaire');
}
export async function getInventaire(id: number): Promise<Inventaire> {
  return apiFetch(`/inventaire/${id}`);
}
export async function createInventaire(data: InventairePayload, isFirst: boolean): Promise<Inventaire> {
  return apiFetch(`/inventaire?premier=${isFirst}`, { method: 'POST', body: JSON.stringify(data) });
}

// ========== Restocking API ==========
export async function getReapprovisionnements(): Promise<Reapprovisionnement[]> {
  return apiFetch('/reappro');
}
export async function getReapprovisionnement(id: number): Promise<Reapprovisionnement> {
  return apiFetch(`/reappro/${id}`);
}
export async function createReapprovisionnement(data: ReapproPayload): Promise<Reapprovisionnement> {
  return apiFetch('/reappro', { method: 'POST', body: JSON.stringify(data) });
}

// ========== Commandes API ==========
export async function getCommandes(): Promise<Commande[]> {
  return apiFetch('/commandes');
}
export async function getCommandesByClientId(clientId: number): Promise<Commande[]> {
    return apiFetch(`/commandes/client/${clientId}`);
}
export async function createCommande(data: CommandePayload): Promise<Commande> {
    return apiFetch('/commandes', { method: 'POST', body: JSON.stringify(data) });
}
export async function validerCommande(id: number): Promise<ValidationCommandeResponse> {
    return apiFetch(`/commandes/${id}/valider`, { method: 'POST' });
}
export async function annulerCommande(id: number): Promise<Commande> {
    return apiFetch(`/commandes/${id}/annuler`, { method: 'PUT' });
}
export async function getDocumentsByCommandeId(id: number): Promise<ValidationCommandeResponse> {
    return apiFetch(`/commandes/${id}/documents`);
}


// ========== Factures API ==========
export async function getFactures(): Promise<Facture[]> {
    return apiFetch('/factures');
}
export async function genererFacture(commandeId: number): Promise<Facture> {
    return apiFetch(`/factures?commandeId=${commandeId}`, { method: 'POST' });
}
export async function deleteFacture(id: number): Promise<null> {
    return apiFetch(`/factures/${id}`, { method: 'DELETE' });
}
// ========== Bons de Livraison API ==========
export async function getAllBonsLivraison(): Promise<BonLivraison[]> {
    return apiFetch(`/livraisons`);
}
export async function getBonsLivraisonParLieu(): Promise<BonLivraison[]> {
    return apiFetch(`/livraisons/bons`);
}
export async function genererBonLivraison(commandeId: number): Promise<BonLivraison> {
    return apiFetch(`/livraisons?commandeId=${commandeId}`, { method: 'POST' });
}
export async function validerLivraison(id: number): Promise<BonLivraison> {
    return apiFetch(`/livraisons/${id}/valider`, { method: 'PUT' });
}
