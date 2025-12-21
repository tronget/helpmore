import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface AuthUserProfile {
  name: string;
  surname: string;
  middleName?: string | null;
  avatar?: string | null;
  faculty?: string | null;
  phoneNumber?: string | null;
  telegram?: string | null;
  rate?: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt?: string;
  bannedTill?: string | null;
  profile?: AuthUserProfile | null;
}

export interface AuthSession {
  token: string;
  expiresIn?: number;
  user?: AuthUser;
  rawPayload?: unknown;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  expiresIn?: number;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const tokenAtom = atomWithStorage<string | null>('auth.token', null);
const userAtom = atomWithStorage<AuthUser | null>('auth.user', null);
const expiresInAtom = atomWithStorage<number | undefined>('auth.expiresIn', undefined);
const isAuthenticatedAtom = atom((get) => Boolean(get(tokenAtom)));

const loginAtom = atom(null, (_get, set, session: AuthSession) => {
  set(tokenAtom, session.token);
  set(expiresInAtom, session.expiresIn);
  set(userAtom, session.user ?? null);
});

const logoutAtom = atom(null, (_get, set) => {
  set(tokenAtom, null);
  set(expiresInAtom, undefined);
  set(userAtom, null);
});

const setUserAtom = atom(null, (_get, set, user: AuthUser | null) => {
  set(userAtom, user);
});

export const useAuthStore = (): AuthState => {
  const token = useAtomValue(tokenAtom);
  const user = useAtomValue(userAtom);
  const expiresIn = useAtomValue(expiresInAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const login = useSetAtom(loginAtom);
  const logout = useSetAtom(logoutAtom);
  const setUser = useSetAtom(setUserAtom);

  return {
    token,
    user,
    expiresIn,
    isAuthenticated,
    login,
    logout,
    setUser,
  };
};
