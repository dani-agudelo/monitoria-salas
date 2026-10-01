import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/ingreso")({
  head: () => ({
    meta: [
      { title: "Ingreso — Monitoría de Salas" },
      { name: "description", content: "Ingreso de coordinadores y monitores." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn, profile, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setPending(false);
    if (message) setError(message);
  }

  useEffect(() => {
    if (!ready || !profile) return;
    void navigate({
      to: profile.role === "coordinator" ? "/coordinacion" : "/monitor",
    });
  }, [navigate, profile, ready]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-slate-100/50 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <small className="font-bold uppercase text-primary">Ingreso</small>
        <h1 className="mt-3 text-4xl text-secondary">Monitoría de Salas</h1>
        {!isSupabaseConfigured && (
          <p className="mt-6 text-sm text-secondary">
            Aún no están configuradas VITE_SUPABASE_URL y
            VITE_SUPABASE_ANON_KEY.
          </p>
        )}
        <label
          className="mt-8 block text-sm font-bold text-secondary"
          htmlFor="email"
        >
          Correo
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <label
          className="mt-4 block text-sm font-bold text-secondary"
          htmlFor="password"
        >
          Contraseña
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p className="mt-4 text-sm font-bold text-primary">{error}</p>
        )}
        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={pending || !isSupabaseConfigured}
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </Button>
        <Link
          to="/"
          className="mt-4 block text-center text-sm font-bold text-muted-foreground hover:text-primary"
        >
          Ver salas disponibles
        </Link>
      </form>
    </main>
  );
}
