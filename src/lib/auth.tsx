import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "coordinator" | "monitor";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

type AuthState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.role !== "coordinator" && data.role !== "monitor") return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextSession = data.session;
      setSession(nextSession);
      setProfile(nextSession ? await loadProfile(nextSession.user.id) : null);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        return;
      }
      window.setTimeout(() => {
        void loadProfile(nextSession.user.id).then((nextProfile) => {
          if (active) setProfile(nextProfile);
        });
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      profile,
      async signIn(email, password) {
        if (!supabase) {
          return "Falta conectar Supabase. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.";
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error ? "Correo o contraseña incorrectos." : null;
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
      },
    }),
    [profile, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}

export function RequireRole({
  role,
  children,
}: {
  role: AppRole;
  children: ReactNode;
}) {
  const { ready, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      void navigate({ to: "/ingreso" });
      return;
    }
    if (profile.role !== role) {
      void navigate({
        to: profile.role === "coordinator" ? "/coordinacion" : "/monitor",
      });
    }
  }, [navigate, profile, ready, role]);

  if (!ready) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Comprobando sesión…</p>
    );
  }
  if (!profile || profile.role !== role) return null;
  return children;
}
