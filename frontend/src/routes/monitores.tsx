import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { listOpenPresences } from "@/lib/board";
import {
  createMonitor,
  deleteMonitor,
  listMonitors,
  updateMonitor,
  type MonitorAccount,
} from "@/lib/monitor-accounts";

export const Route = createFileRoute("/monitores")({
  head: () => ({
    meta: [
      { title: "Monitores — Monitoría de Salas" },
      { name: "description", content: "Cuentas de los monitores." },
    ],
  }),
  component: MonitorsPage,
});

const fieldClass =
  "mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function MonitorsPage() {
  const { session, profile } = useAuth();
  const [monitors, setMonitors] = useState<MonitorAccount[]>([]);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MonitorAccount | null>(null);
  const [removing, setRemoving] = useState<MonitorAccount | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session || profile?.role !== "coordinator") return;
    let active = true;
    Promise.all([
      listMonitors(session.accessToken),
      listOpenPresences(session.accessToken),
    ])
      .then(([accounts, presences]) => {
        if (!active) return;
        setMonitors(accounts);
        setBusy(new Set(presences.map((item) => item.monitorId)));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "No se pudieron cargar los monitores.",
        );
      });
    return () => {
      active = false;
    };
  }, [profile, session]);

  async function refresh() {
    if (!session) return;
    const [accounts, presences] = await Promise.all([
      listMonitors(session.accessToken),
      listOpenPresences(session.accessToken),
    ]);
    setMonitors(accounts);
    setBusy(new Set(presences.map((item) => item.monitorId)));
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setPending(true);
    setFormError(null);
    try {
      await createMonitor(session.accessToken, {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setCreating(false);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo crear el monitor.",
      );
    } finally {
      setPending(false);
    }
  }

  function openEditor(monitor: MonitorAccount) {
    setEditing(monitor);
    setEditName(monitor.full_name);
    setEditEmail(monitor.email);
    setEditPassword("");
    setFormError(null);
  }

  async function onUpdate(event: FormEvent) {
    event.preventDefault();
    if (!session || !editing) return;
    setPending(true);
    setFormError(null);
    try {
      await updateMonitor(session.accessToken, editing.id, {
        fullName: editName.trim(),
        email: editEmail.trim(),
        ...(editPassword ? { password: editPassword } : {}),
      });
      setEditing(null);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo actualizar el monitor.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!session || !removing) return;
    setPending(true);
    setFormError(null);
    try {
      await deleteMonitor(session.accessToken, removing.id);
      setRemoving(null);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo eliminar el monitor.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <RequireRole role="coordinator">
      <DashboardShell role="Coordinación" title="Monitores">
        <section className="bento-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-secondary">Equipo de monitoría</h2>
              <p className="mt-1 text-muted-foreground">
                {monitors.length} cuentas
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setFormError(null);
                setCreating(true);
              }}
            >
              <Plus size={18} strokeWidth={1.5} /> Añadir monitor
            </Button>
          </div>
          {error && (
            <p className="mt-6 text-sm font-bold text-primary">{error}</p>
          )}
          {monitors.length === 0 && !error && (
            <p className="mt-8 text-sm text-muted-foreground">
              Aún no hay monitores.
            </p>
          )}
          <ul className="mt-4 divide-y divide-border">
            {monitors.map((monitor) => (
              <li key={monitor.id} className="flex items-center gap-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {initials(monitor.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-secondary">
                    {monitor.full_name}
                  </p>
                  <small className="block truncate text-muted-foreground">
                    {busy.has(monitor.id) ? "En sala" : "Libre"} ·{" "}
                    {monitor.email}
                  </small>
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${monitor.full_name}`}
                  className="grid size-9 place-items-center rounded-xl text-secondary hover:bg-orange-50 hover:text-primary"
                  onClick={() => openEditor(monitor)}
                >
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${monitor.full_name}`}
                  className="grid size-9 place-items-center rounded-xl text-primary hover:bg-orange-50"
                  onClick={() => {
                    setFormError(null);
                    setRemoving(monitor);
                  }}
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        </section>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir monitor</DialogTitle>
              <DialogDescription>
                La cuenta queda lista para ingresar al panel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreate} className="grid gap-3">
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="monitor-name"
              >
                Nombre
                <input
                  id="monitor-name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="monitor-email"
              >
                Correo
                <input
                  id="monitor-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="monitor-password"
              >
                Contraseña
                <input
                  id="monitor-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={fieldClass}
                />
              </label>
              {formError && (
                <p className="text-sm font-bold text-primary">{formError}</p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Creando cuenta…" : "Crear cuenta"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar monitor</DialogTitle>
              <DialogDescription>
                Cambia el nombre, el correo o la contraseña. Si dejas la
                contraseña vacía, se conserva.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onUpdate} className="grid gap-3">
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="edit-name"
              >
                Nombre
                <input
                  id="edit-name"
                  required
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="edit-email"
              >
                Correo
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="edit-password"
              >
                Nueva contraseña
                <input
                  id="edit-password"
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(event) => setEditPassword(event.target.value)}
                  className={fieldClass}
                />
              </label>
              {formError && (
                <p className="text-sm font-bold text-primary">{formError}</p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={removing !== null}
          onOpenChange={(open) => !open && setRemoving(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar monitor</DialogTitle>
              <DialogDescription>
                {removing
                  ? `Se borra la cuenta de ${removing.full_name} y ya no podrá ingresar.`
                  : "Se borra la cuenta."}
              </DialogDescription>
            </DialogHeader>
            {formError && (
              <p className="text-sm font-bold text-primary">{formError}</p>
            )}
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void onDelete()}
            >
              {pending ? "Eliminando…" : "Eliminar cuenta"}
            </Button>
          </DialogContent>
        </Dialog>
      </DashboardShell>
    </RequireRole>
  );
}
