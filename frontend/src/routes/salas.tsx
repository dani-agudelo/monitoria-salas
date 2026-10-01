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
import {
  createRoom,
  deleteRoom,
  getLocations,
  listRooms,
  updateRoom,
  type CatalogRoom,
  type LocationItem,
} from "@/lib/board";

export const Route = createFileRoute("/salas")({
  head: () => ({
    meta: [
      { title: "Salas — Monitoría de Salas" },
      { name: "description", content: "Salas registradas del programa." },
    ],
  }),
  component: RoomsPage,
});

const fieldClass =
  "mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

function RoomsPage() {
  const { session, profile } = useAuth();
  const [rooms, setRooms] = useState<CatalogRoom[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CatalogRoom | null>(null);
  const [removing, setRemoving] = useState<CatalogRoom | null>(null);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [capacity, setCapacity] = useState("32");
  const [features, setFeatures] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session || profile?.role !== "coordinator") return;
    let active = true;
    Promise.all([listRooms(session.accessToken), getLocations()])
      .then(([nextRooms, nextLocations]) => {
        if (!active) return;
        setRooms(nextRooms);
        setLocations(nextLocations);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "No se pudieron cargar las salas.",
        );
      });
    return () => {
      active = false;
    };
  }, [profile, session]);

  async function refresh() {
    if (!session) return;
    const [nextRooms, nextLocations] = await Promise.all([
      listRooms(session.accessToken),
      getLocations(),
    ]);
    setRooms(nextRooms);
    setLocations(nextLocations);
  }

  function openCreate() {
    setName("");
    setLocationId(locations[0]?.id ?? "");
    setCapacity("32");
    setFeatures("");
    setFormError(null);
    setCreating(true);
  }

  function openEditor(room: CatalogRoom) {
    setEditing(room);
    setName(room.name);
    setLocationId(room.locationId);
    setCapacity(String(room.capacity));
    setFeatures(room.features.join(", "));
    setFormError(null);
  }

  function payload() {
    return {
      name: name.trim(),
      locationId,
      capacity: Number(capacity),
      features: features
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setPending(true);
    setFormError(null);
    try {
      await createRoom(session.accessToken, payload());
      setCreating(false);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo crear la sala.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onUpdate(event: FormEvent) {
    event.preventDefault();
    if (!session || !editing) return;
    setPending(true);
    setFormError(null);
    try {
      await updateRoom(session.accessToken, editing.id, payload());
      setEditing(null);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo actualizar la sala.",
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
      await deleteRoom(session.accessToken, removing.id);
      setRemoving(null);
      await refresh();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo eliminar la sala.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <RequireRole role="coordinator">
      <DashboardShell role="Coordinación" title="Salas">
        <section className="bento-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-secondary">Salas registradas</h2>
              <p className="mt-1 text-muted-foreground">
                {rooms.length} en el sistema
              </p>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus size={18} strokeWidth={1.5} /> Añadir sala
            </Button>
          </div>
          {error && (
            <p className="mt-6 text-sm font-bold text-primary">{error}</p>
          )}
          {rooms.length === 0 && !error && (
            <p className="mt-8 text-sm text-muted-foreground">
              Todavía no hay salas.
            </p>
          )}
          <ul className="mt-4 divide-y divide-border">
            {rooms.map((room) => (
              <li key={room.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-secondary">
                    {room.name}
                  </p>
                  <small className="text-muted-foreground">
                    {room.locationName} · {room.capacity} equipos
                  </small>
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${room.name}`}
                  className="grid size-9 place-items-center rounded-xl text-secondary hover:bg-orange-50 hover:text-primary"
                  onClick={() => openEditor(room)}
                >
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${room.name}`}
                  className="grid size-9 place-items-center rounded-xl text-primary hover:bg-orange-50"
                  onClick={() => {
                    setFormError(null);
                    setRemoving(room);
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
              <DialogTitle>Añadir sala</DialogTitle>
              <DialogDescription>
                Queda disponible para asignar monitores.
              </DialogDescription>
            </DialogHeader>
            <RoomForm
              name={name}
              locationId={locationId}
              capacity={capacity}
              features={features}
              locations={locations}
              formError={formError}
              pending={pending}
              submitLabel={pending ? "Creando…" : "Crear sala"}
              onName={setName}
              onLocation={setLocationId}
              onCapacity={setCapacity}
              onFeatures={setFeatures}
              onSubmit={onCreate}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar sala</DialogTitle>
              <DialogDescription>
                Nombre, sede, capacidad y características.
              </DialogDescription>
            </DialogHeader>
            <RoomForm
              name={name}
              locationId={locationId}
              capacity={capacity}
              features={features}
              locations={locations}
              formError={formError}
              pending={pending}
              submitLabel={pending ? "Guardando…" : "Guardar cambios"}
              onName={setName}
              onLocation={setLocationId}
              onCapacity={setCapacity}
              onFeatures={setFeatures}
              onSubmit={onUpdate}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={removing !== null}
          onOpenChange={(open) => !open && setRemoving(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar sala</DialogTitle>
              <DialogDescription>
                {removing
                  ? `Se quita ${removing.name} del listado.`
                  : "Se quita la sala del listado."}
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
              {pending ? "Eliminando…" : "Eliminar sala"}
            </Button>
          </DialogContent>
        </Dialog>
      </DashboardShell>
    </RequireRole>
  );
}

function RoomForm({
  name,
  locationId,
  capacity,
  features,
  locations,
  formError,
  pending,
  submitLabel,
  onName,
  onLocation,
  onCapacity,
  onFeatures,
  onSubmit,
}: {
  name: string;
  locationId: string;
  capacity: string;
  features: string;
  locations: LocationItem[];
  formError: string | null;
  pending: boolean;
  submitLabel: string;
  onName: (value: string) => void;
  onLocation: (value: string) => void;
  onCapacity: (value: string) => void;
  onFeatures: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="text-sm font-bold text-secondary" htmlFor="room-name">
        Nombre
        <input
          id="room-name"
          required
          value={name}
          onChange={(event) => onName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label
        className="text-sm font-bold text-secondary"
        htmlFor="room-location"
      >
        Sede
        <select
          id="room-location"
          required
          value={locationId}
          onChange={(event) => onLocation(event.target.value)}
          className={fieldClass}
        >
          <option value="">Elige una sede</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label
        className="text-sm font-bold text-secondary"
        htmlFor="room-capacity"
      >
        Capacidad
        <input
          id="room-capacity"
          type="number"
          min={1}
          required
          value={capacity}
          onChange={(event) => onCapacity(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label
        className="text-sm font-bold text-secondary"
        htmlFor="room-features"
      >
        Características
        <input
          id="room-features"
          value={features}
          placeholder="32 equipos, Aire acondicionado"
          onChange={(event) => onFeatures(event.target.value)}
          className={fieldClass}
        />
      </label>
      {formError && (
        <p className="text-sm font-bold text-primary">{formError}</p>
      )}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
