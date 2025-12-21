import { useEffect, useMemo, useState } from 'react';
import type { UserResponse } from '../api/userService';
import { getUserById } from '../api/userService';

export const useUsersById = (ids: number[], token: string | null) => {
  const [users, setUsers] = useState<Record<number, UserResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueIds = useMemo(
    () => Array.from(new Set(ids)).filter((id) => Number.isFinite(id)),
    [ids],
  );

  useEffect(() => {
    if (!token || uniqueIds.length === 0) {
      setUsers({});
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            const user = await getUserById(token, id);
            return [id, user] as const;
          }),
        );
        if (!active) {
          return;
        }
        setUsers(Object.fromEntries(entries));
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Не удалось загрузить пользователей';
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
  }, [token, uniqueIds]);

  return { users, isLoading, error };
};
