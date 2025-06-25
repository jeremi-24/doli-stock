// This is now a client-side library. No 'use server' directive.
import type { Categorie, Produit } from './types';

// All API calls will be sent to the Next.js proxy configured in next.config.ts
const API_BASE_URL = '/api';

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
      }

      throw new Error(userMessage);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
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
  const body = { id: 0, nom: data.nom, produits: [] };
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
