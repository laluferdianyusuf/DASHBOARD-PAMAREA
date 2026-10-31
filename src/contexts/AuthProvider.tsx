import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
  user: AuthUser | null;
}

export function AuthProvider({ children, user }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
