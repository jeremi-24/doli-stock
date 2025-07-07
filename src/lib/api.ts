// This is now a client-side library. No 'use server' directive.
import type { Categorie, Produit, Entrepot, AssignationPayload, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Vente, VentePayload, Client, ShopInfo } from './types';

// All API calls will be sent to the Next.js proxy configured in next.config.ts
const API_BASE_URL = '/api'; 

// Custom Error class to include status code
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
        const errorBody = await response.text();
        let serverMessage = '';

        try {
            const errorJson = JSON.parse(errorBody);
            serverMessage = errorJson.error || errorJson.message || errorBody;
        } catch (e) {
            serverMessage = errorBody;
        }
        
        console.error(`API Error: ${response.status}`, { url, options, errorBody: serverMessage });
        
        let userMessage = serverMessage;
        // Don't show generic HTML error pages or meaningless messages to the user
        if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().startsWith('<') || userMessage.trim() === 'OK') {
            switch (response.status) {
                case 400: userMessage = 'La requête est incorrecte. Veuillez vérifier les informations soumises.'; break;
                case 401: userMessage = 'Session expirée. Veuillez vous reconnecter.'; break;
                case 403: userMessage = 'Accès refusé. Vous n\'avez pas les droits nécessaires pour effectuer cette action.'; break;
                case 404: userMessage = 'La ressource demandée n\'a pas été trouvée sur le serveur.'; break;
                case 500: userMessage = 'Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.'; break;
                case 503: case 504: userMessage = 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.'; break;
                default: userMessage = `Une erreur inattendue est survenue (Code: ${response.status}).`;
            }
        }
      
      throw new ApiError(userMessage, response.status);
    }
    
    // Check for a new token in the response headers and update it.
    const newTokenHeader = response.headers.get('Authorization');
    if (newTokenHeader && newTokenHeader.startsWith('Bearer ')) {
      const newToken = newTokenHeader.substring(7); // "Bearer ".length
      if (typeof window !== 'undefined') {
        localStorage.setItem('stockhero_token', newToken);
      }
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
        // Re-throw custom API errors that we've already formatted
        throw error;
    }
    
    if (error instanceof TypeError) {
      // Handle network errors (e.g., "Failed to fetch")
      const networkErrorMessage = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et que le service est bien en ligne.';
      console.error('Erreur de connexion API:', { url, error });
      throw new ApiError(networkErrorMessage, 0); // Use status 0 for network errors
    }

    // Re-throw any other unexpected errors
    console.error('Erreur inattendue dans apiFetch:', { url, error });
    throw error;
  }
}

// ========== Auth API ==========
export async function loginUser(data: LoginPayload): Promise<any> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
}

export async function signupUser(data: SignupPayload): Promise<any> {
  const { confirmPassword, ...payload } = data; // Don't send confirmPassword to backend
  return apiFetch('/auth/save', { method: 'POST', body: JSON.stringify(payload) });
}

// ========== Organisation API ==========
export async function getOrganisations(): Promise<ShopInfo[]> {
    return apiFetch('/organisations');
}
export async function saveOrganisation(data: Partial<ShopInfo>): Promise<ShopInfo> {
    return apiFetch('/organisations', { method: 'POST', body: JSON.stringify(data) });
}

// ========== Clients API ==========
export async function getClients(): Promise<Client[]> { return apiFetch('/client'); }
export async function createClient(data: Omit<Client, 'id'>): Promise<Client> {
  return apiFetch('/client', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  return apiFetch(`/client/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteClient(id: number): Promise<null> {
  return apiFetch(`/client/${id}`, { method: 'DELETE' });
}

// ========== Categories API ==========
export async function getCategories(): Promise<Categorie[]> { return apiFetch('/categorie'); };
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

// ========== Entrepots API ==========
export async function getEntrepots(): Promise<Entrepot[]> { return apiFetch('/entrepot'); };
export async function createEntrepot(data: { nom: string, ref: string }): Promise<Entrepot> {
  const body = { nom: data.nom, ref: data.ref };
  return apiFetch('/entrepot', { method: 'POST', body: JSON.stringify(body) });
};
export async function updateEntrepot(id: number, data: Partial<Entrepot>): Promise<Entrepot> {
  const body = { ...data, id };
  return apiFetch(`/entrepot/${id}`, { method: 'PUT', body: JSON.stringify(body) });
};
export async function deleteEntrepots(ids: number[]): Promise<null> {
  return apiFetch(`/entrepot`, { method: 'DELETE', body: JSON.stringify(ids) });
};

// ========== Products API ==========
export async function getProducts(): Promise<Produit[]> {
    return apiFetch(`/produit`);
}
export async function getProductByBarcode(codeBarre: string): Promise<Produit | null> {
    return apiFetch(`/produit/code/${codeBarre}`);
}
export async function createProduct(data: any): Promise<any> {
  return apiFetch('/produit', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateProduct(id: number, data: Partial<any>): Promise<any> {
  const body = { ...data, id };
  return apiFetch(`/produit/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}
export async function deleteProducts(ids: number[]): Promise<null> {
  return apiFetch(`/produit`, { method: 'DELETE', body: JSON.stringify(ids) });
}
export async function assignProducts(data: AssignationPayload): Promise<null> {
    const payload = {
        produitIds: data.produitIds,
        ...(data.categorieId && { categorieId: data.categorieId }),
        ...(data.entrepotId && { entrepotId: data.entrepotId }),
    };
  return apiFetch(`/produit/assignation`, { method: 'PUT', body: JSON.stringify(payload) });
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
    const response = await fetch(`${API_BASE_URL}/produit/import`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const statusText = response.statusText || 'Erreur inconnue';
      let userMessage = `La requête API a échoué: ${statusText} (status: ${response.status})`;
       if (response.status === 503 || response.status === 504) {
          userMessage = 'Le serveur backend ne répond pas (Gateway Timeout). Veuillez vérifier qu\'il est bien démarré et accessible.';
      } else if (errorBody) {
         try {
            const errorJson = JSON.parse(errorBody);
            userMessage = errorJson.error || errorJson.message || userMessage;
         } catch(e) {
            userMessage = `${userMessage}: ${errorBody}`;
         }
      }
      throw new Error(userMessage);
    }
    
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn(`API response for /produit/import was successful but not valid JSON. Response body: "${text}"`);
      return null;
    }
  } catch (error) {
    console.error('Erreur de connexion API pour importProducts:', { error });
    throw error;
  }
};
export async function printBarcodes(data: { produitNom: string, quantite: number }): Promise<Blob> {
  const url = `${API_BASE_URL}/barcode/print`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('stockhero_token') : null;
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/pdf',
    ...authHeader
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const statusText = response.statusText || 'Erreur inconnue';
      let userMessage = `La génération du PDF a échoué: ${statusText} (status: ${response.status})`;
      if (response.status === 503 || response.status === 504) {
          userMessage = 'Le serveur backend ne répond pas (Gateway Timeout). Veuillez vérifier qu\'il est bien démarré et accessible.';
      } else if (errorBody) {
         try {
            const errorJson = JSON.parse(errorBody);
            userMessage = errorJson.error || errorJson.message || userMessage;
         } catch(e) {
            userMessage = `${userMessage}: ${errorBody}`;
         }
      }
      throw new Error(userMessage);
    }
    
    return response.blob();

  } catch (error) {
    console.error('Erreur de connexion API pour printBarcodes:', { url, error });
    throw error;
  }
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

// ========== Sales API ==========
export async function getVentes(): Promise<Vente[]> {
  return apiFetch('/vente');
}

export async function createVente(data: VentePayload): Promise<Vente> {
  return apiFetch('/vente', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteVente(id: number): Promise<null> {
  return apiFetch(`/vente/${id}`, { method: 'DELETE' });
}
