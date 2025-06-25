'use server';

import type { Categorie, Produit } from './types';

// Utilisation de la variable d'environnement pour l'URL du backend
const API_BASE_URL = process.env.BACKEND_API_URL;

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Fetching: ${options.method || 'GET'} ${url}`);

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
      console.error(`API Error: ${response.status} ${response.statusText}`, { url, options, errorBody });
      throw new Error(`La requête API a échoué: ${response.statusText}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Erreur de connexion API:', { url, error });
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
  console.log(`Fetching: POST ${url}`);
  
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
