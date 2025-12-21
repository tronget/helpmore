import { useEffect, useState } from 'react';
import type { CategoryDto } from '../api/marketplaceService';
import { getCategories } from '../api/marketplaceService';

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getCategories();
        if (!active) {
          return;
        }
        setCategories(data);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Не удалось загрузить категории';
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return { categories, isLoading, error };
};
