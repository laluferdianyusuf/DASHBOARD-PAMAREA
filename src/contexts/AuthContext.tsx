import { createContext } from "react";
import type { ReactNode } from "react";

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  siteId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
}

interface AuthProviderProps {
  children: ReactNode;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export type { AuthContextValue, AuthProviderProps };
