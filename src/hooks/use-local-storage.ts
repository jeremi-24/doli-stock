
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Fonction pour lire la valeur depuis le localStorage
  const readValue = useCallback((): T => {
    // S'assurer que ce code ne s'exécute que côté client
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // L'état est initialisé avec la valeur par défaut
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Le `useEffect` s'assure que la lecture du localStorage ne se fait que côté client
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue: SetValue<T> = value => {
    // S'assurer que ce code ne s'exécute que côté client
    if (typeof window === 'undefined') {
      console.warn(
        `Tried to set localStorage key “${key}” even though window is not defined`
      );
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      window.dispatchEvent(new Event('local-storage-event'));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // S'assurer que les écouteurs ne sont ajoutés que côté client
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('local-storage-event', handleStorageChange);
    
        return () => {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('local-storage-event', handleStorageChange);
        };
    }
  }, [readValue]);

  return [storedValue, setValue];
}
