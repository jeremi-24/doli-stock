// This is now a client-side library. No 'use server' directive.
import type { Categorie, Produit, Entrepot, AssignationPayload, FactureModele, LoginPayload, SignupPayload, InventairePayload, Inventaire, ReapproPayload, Reapprovisionnement, Vente, VentePayload, Client, ShopInfo } from './types';

// All API calls will be sent to the Next.js proxy configured in next.config.ts
const API_BASE_URL = '/api'; 

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
      const statusText = response.statusText || 'Erreur inconnue';
      console.error(`API Error: ${response.status} ${statusText}`, { url, options, errorBody });
      
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
      console.warn(`API response for ${endpoint} was successful but not valid JSON. Response body: "${text}"`);
      return null;
    }

  } catch (error) {
    console.error('Erreur de connexion API:', { url, error });
    // Re-throw the error so it can be caught by the calling function
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


// ========== FactureModeles API ==========
export async function getFactureModeles(): Promise<FactureModele[]> { 
    return apiFetch('/facture'); 
}
export async function createFactureModele(data: Omit<FactureModele, 'id'>): Promise<FactureModele> {
  return apiFetch('/facture', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateFactureModele(id: string, data: Partial<FactureModele>): Promise<FactureModele> {
  return apiFetch(`/facture/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteFactureModele(id: string): Promise<null> {
  return apiFetch(`/facture/${id}`, { method: 'DELETE' });
}
