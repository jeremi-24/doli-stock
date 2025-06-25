'use server';

import type { Categorie, Produit } from './types';

// Utilise un chemin relatif pour que le proxy de Next.js (configuré dans next.config.ts) puisse fonctionner.
const API_BASE_URL = '/api';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`La requête API a échoué: ${response.statusText}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Erreur de connexion API:', error);
    throw error;
  }
}

// ========== Categories API ==========

export const getCategories = async (): Promise<Categorie[]> => {
  return apiFetch('/categorie');
};

export const getCategoryById = async (id: number): Promise<Categorie> => {
  return apiFetch(`/categorie/${id}`);
};

export const createCategory = async (data: { nom: string }): Promise<Categorie> => {
  // Conforme au corps de requête attendu par l'API
  const body = { id: 0, nom: data.nom, produits: [] };
  return apiFetch('/categorie', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const updateCategory = async (id: number, data: Partial<Categorie>): Promise<Categorie> => {
  return apiFetch(`/categorie/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (id: number): Promise<null> => {
  return apiFetch(`/categorie/${id}`, {
    method: 'DELETE',
  });
};

// ========== Products API ==========

export const importProducts = async (formData: FormData): Promise<Produit[]> => {
  // On n'utilise pas apiFetch car le content-type est multipart/form-data
  const res = await fetch(`${API_BASE_URL}/produit/import`, {
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
