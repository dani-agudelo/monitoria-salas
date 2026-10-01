import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api, ApiError } from "@/lib/api";
import {
  AuthContext,
  useAuth,
  type AppRole,
  type AuthSession,
  type Profile,
} from "@/lib/auth-context";

const ACCESS_KEY = "monitoria.access";
const REFRESH_KEY = "monitoria.refresh";

type SessionResponse = {
  accessToken: string;
  refreshToken: string;
  profile: Profile;
};

function readSession(): AuthSession | null {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function writeSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setReady(true);
      return;
    }

    let active = true;
    api<Profile>("/auth/me", { token: stored.accessToken })
      .then((nextProfile) => {
        if (!active) return;
        setSession(stored);
        setProfile(nextProfile);
      })
      .catch(async () => {
        try {
          const next = await api<SessionResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: stored.refreshToken }),
          });
          if (!active) return;
          const nextSession = {
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
          };
          writeSession(nextSession);
          setSession(nextSession);
          setProfile(next.profile);
        } catch {
          if (!active) return;
          writeSession(null);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      profile,
      async signIn(email: string, password: string) {
        try {
          const next = await api<SessionResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          const nextSession = {
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
          };
          writeSession(nextSession);
          setSession(nextSession);
          setProfile(next.profile);
          return null;
        } catch (error) {
          return error instanceof ApiError
            ? error.message
            : "No se pudo ingresar.";
        }
      },
      async signOut() {
        if (session) {
          await api("/auth/logout", {
            method: "POST",
            token: session.accessToken,
          }).catch(() => undefined);
        }
        writeSession(null);
        setSession(null);
        setProfile(null);
      },
    }),
    [profile, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
