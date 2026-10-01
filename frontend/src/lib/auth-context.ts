import { createContext, useContext } from "react";

export type AppRole = "coordinator" | "monitor";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type AuthState = {
  ready: boolean;
  session: AuthSession | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}
