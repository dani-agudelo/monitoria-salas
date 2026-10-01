import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, ClipboardList, Eye, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const iconProps = { size: 20, strokeWidth: 1.5 } as const;

const links = [
  { to: "/", label: "Salas disponibles", icon: Eye },
  { to: "/coordinacion", label: "Coordinación", icon: ClipboardList },
  { to: "/monitor", label: "Mis turnos", icon: Calendar },
] as const;

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className="leading-tight">
      <span>
        <strong
          className={`block text-sm font-extrabold ${inverse ? "text-secondary-foreground" : "text-secondary"}`}
        >
          Monitoría
        </strong>
        <small
          className={`block text-xs ${inverse ? "text-secondary-foreground/55" : "text-muted-foreground"}`}
        >
          de Salas
        </small>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-7xl rounded-lg glass-panel">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 text-sm font-bold transition-colors ${pathname === to ? "text-primary" : "text-muted-foreground hover:text-secondary"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X {...iconProps} /> : <Menu {...iconProps} />}
        </Button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-border p-3 md:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-secondary hover:bg-orange-50 hover:text-orange-600"
            >
              <Icon {...iconProps} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function DashboardShell({
  role,
  title,
  children,
}: {
  role: "Coordinación" | "Monitor";
  title: string;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function leave() {
    await signOut();
    await navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-100 bg-white p-6 text-secondary lg:flex lg:flex-col">
        <Brand />
        <div className="mt-12">
          <small className="font-bold uppercase text-slate-400">
            Panel de {role}
          </small>
          <nav className="mt-4 grid gap-1">
            <Link
              to={role === "Coordinación" ? "/coordinacion" : "/monitor"}
              className="flex items-center gap-3 rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-600"
            >
              <ClipboardList {...iconProps} />
              Resumen
            </Link>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-orange-50 hover:text-orange-600"
            >
              <Eye {...iconProps} />
              Vista pública
            </Link>
          </nav>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-xl md:px-8">
          <div>
            <small className="font-bold uppercase text-primary">{role}</small>
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => void leave()}
            className="text-sm font-bold text-muted-foreground hover:text-primary"
          >
            Salir del panel
          </button>
        </header>
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
