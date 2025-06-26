// This is now a client-side library. No 'use server' directive.
import type { Categorie, Produit } from './types';

// All API calls will be sent to the Next.js proxy configured in next.config.ts
const API_BASE_URL = 'http://192.168.1.140:8080';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const statusText = response.statusText || 'Erreur inconnue';
      console.error(`API Error: ${response.status} ${statusText}`, { url, options, errorBody });
      
      let userMessage = `La requête API a échoué: ${statusText} (status: ${response.status})`;
      if (response.status === 504) {
          userMessage = 'Le serveur backend ne répond pas (Gateway Timeout 504). Veuillez vérifier qu\'il est bien démarré et accessible.';
      } else if (errorBody) {
         userMessage = `${userMessage}: ${errorBody}`;
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

// ========== Categories API ==========

export async function getCategories(): Promise<Categorie[]> {
  return apiFetch('/categorie');
};

export async function getCategoryById(id: number): Promise<Categorie> {
  return apiFetch(`/categorie/${id}`);
};

export async function createCategory(data: { nom: string }): Promise<Categorie> {
  const body = { nom: data.nom, produits: [] };
  return apiFetch('/categorie', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export async function updateCategory(id: number, data: Partial<Categorie>): Promise<Categorie> {
  return apiFetch(`/categorie/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export async function deleteCategory(id: number): Promise<null> {
  return apiFetch(`/categorie/${id}`, {
    method: 'DELETE',
  });
};


// ========== Products API ==========

export async function getProducts(): Promise<any[]> {
  return apiFetch('/produit');
}

export async function getProductById(id: number): Promise<any> {
  return apiFetch(`/produit/${id}`);
}

export async function createProduct(data: any): Promise<any> {
  return apiFetch('/produit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: number, data: Partial<any>): Promise<any> {
  return apiFetch(`/produit/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: number): Promise<null> {
  return apiFetch(`/produit/${id}`, {
    method: 'DELETE',
  });
}

export async function importProducts(formData: FormData): Promise<Produit[]> {
  const url = `${API_BASE_URL}/produit/import`;
  
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`API Error: ${res.status} ${res.statusText}`, errorBody);
    throw new Error("L'importation des produits a échoué.");
  }
  return res.json();
};
