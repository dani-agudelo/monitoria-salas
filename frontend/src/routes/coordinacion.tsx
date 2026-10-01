import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock3, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/app-shell";
import { CoverageChart } from "@/components/coverage-chart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import {
  assignMonitor,
  closePresence,
  loadCoordinatorBoard,
  type CatalogRoom,
  type CoveragePoint,
  type LocationItem,
  type OpenPresence,
} from "@/lib/board";
import {
  currentTimeValue,
  formatToday,
  shiftLabel,
  timeOnTodayIso,
} from "@/lib/format";
import type { MonitorAccount } from "@/lib/monitor-accounts";

export const Route = createFileRoute("/coordinacion")({
  head: () => ({
    meta: [
      { title: "Panel de Coordinación — Monitoría de Salas" },
      {
        name: "description",
        content: "Asignación de monitores y salas abiertas.",
      },
      {
        property: "og:title",
        content: "Panel de Coordinación — Monitoría de Salas",
      },
      {
        property: "og:description",
        content: "Resumen operativo del programa Monitoría de Salas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoordinatorPage,
});

const fieldClass =
  "mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

function CoordinatorPage() {
  const { session, profile } = useAuth();
  const [monitors, setMonitors] = useState<MonitorAccount[]>([]);
  const [rooms, setRooms] = useState<CatalogRoom[]>([]);
  const [presences, setPresences] = useState<OpenPresence[]>([]);
  const [coverage, setCoverage] = useState<CoveragePoint[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [monitorId, setMonitorId] = useState("");
  const [entryTime, setEntryTime] = useState(currentTimeValue);
  const [exitTime, setExitTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session || profile?.role !== "coordinator") return;
    let active = true;
    loadCoordinatorBoard(session.accessToken)
      .then((board) => {
        if (!active) return;
        setMonitors(board.monitors);
        setRooms(board.rooms);
        setPresences(board.presences);
        setCoverage(board.coverage);
        setLocations(board.locations);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setListError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el panel.",
        );
      });
    return () => {
      active = false;
    };
  }, [profile, session]);

  async function refresh() {
    if (!session) return;
    const board = await loadCoordinatorBoard(session.accessToken);
    setMonitors(board.monitors);
    setRooms(board.rooms);
    setPresences(board.presences);
    setCoverage(board.coverage);
    setLocations(board.locations);
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!session || !roomId || !monitorId) return;
    setPending(true);
    setFormError(null);
    try {
      await assignMonitor(session.accessToken, {
        roomId,
        monitorId,
        startedAt: timeOnTodayIso(entryTime),
        leavesAt: timeOnTodayIso(exitTime),
      });
      setRoomId("");
      setMonitorId("");
      setExitTime("");
      setAssigning(false);
      await refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo asignar el monitor.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onClose(presenceId: string) {
    if (!session) return;
    setPending(true);
    setFormError(null);
    try {
      await closePresence(session.accessToken, presenceId);
      await refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo cerrar la sala.",
      );
    } finally {
      setPending(false);
    }
  }

  const openRoomCount = new Set(presences.map((item) => item.roomId)).size;
  const busyMonitors = new Set(presences.map((item) => item.monitorId));
  const freeMonitors = monitors.filter(
    (monitor) => !busyMonitors.has(monitor.id),
  );
  const availableRooms = rooms.filter(
    (room) => presences.filter((item) => item.roomId === room.id).length < 2,
  );

  return (
    <RequireRole role="coordinator">
      <DashboardShell role="Coordinación" title="Resumen operativo">
        {listError && (
          <p className="mb-5 text-sm font-bold text-primary">{listError}</p>
        )}
        <Button
          type="button"
          className="mb-5"
          onClick={() => {
            setEntryTime(currentTimeValue());
            setExitTime("");
            setFormError(null);
            setAssigning(true);
          }}
        >
          Asignar sala
        </Button>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 gap-5 xl:grid-cols-12"
        >
          <Tile className="bg-secondary text-secondary-foreground xl:col-span-5">
            <div>
              <small className="font-bold uppercase text-secondary-foreground/55">
                Hoy · {formatToday()}
              </small>
              <h2 className="mt-3">Todo bajo control.</h2>
              <p className="mt-3 max-w-sm text-secondary-foreground/60">
                {openRoomCount === 0
                  ? "Ninguna sala está abierta. Asigna a quien acaba de llegar."
                  : `${openRoomCount} ${openRoomCount === 1 ? "sala está operando" : "salas están operando"} con ${presences.length} ${presences.length === 1 ? "monitor" : "monitores"} en este momento.`}
              </p>
            </div>
            <div className="mt-10 flex gap-8">
              <div>
                <strong className="text-3xl">{openRoomCount}</strong>
                <small className="block text-secondary-foreground/55">
                  abiertas
                </small>
              </div>
              <div>
                <strong className="text-3xl">{presences.length}</strong>
                <small className="block text-secondary-foreground/55">
                  en sala
                </small>
              </div>
            </div>
          </Tile>
          <div className="flex flex-col gap-5 xl:col-span-3">
            <Tile className="flex flex-1 flex-col">
              <div className="flex items-center justify-center gap-3">
                <Building2
                  size={22}
                  strokeWidth={1.5}
                  className="text-primary"
                />
                <p className="font-bold text-secondary">Salas</p>
              </div>
              <div className="grid flex-1 place-items-center">
                <strong className="text-4xl text-secondary">
                  {rooms.length}
                </strong>
              </div>
            </Tile>
            <Tile className="flex flex-1 flex-col">
              <div className="flex items-center justify-center gap-3">
                <Users size={22} strokeWidth={1.5} className="text-primary" />
                <p className="font-bold text-secondary">Monitores activos</p>
              </div>
              <div className="grid flex-1 place-items-center text-center">
                <div>
                  <strong className="block text-4xl text-secondary">
                    {monitors.length}
                  </strong>
                  <small className="text-muted-foreground">
                    Cuentas registradas
                  </small>
                </div>
              </div>
            </Tile>
          </div>
          <Tile className="flex flex-col xl:col-span-4">
            <div className="flex items-center justify-center gap-3">
              <MapPin size={22} strokeWidth={1.5} className="text-primary" />
              <p className="font-bold text-secondary">Sedes</p>
            </div>
            <div className="grid flex-1 place-items-center text-center">
              <div className="grid gap-1">
                {locations.map((location) => (
                  <p key={location.id} className="font-bold text-secondary">
                    {location.name}
                  </p>
                ))}
              </div>
            </div>
          </Tile>
          <Tile className="xl:col-span-12">
            <div className="flex items-start justify-between">
              <div>
                <h3>Cobertura de horas</h3>
                <p className="text-muted-foreground">
                  Horas reales de esta semana, de lunes a viernes
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-secondary">Central</span>
                <span className="text-primary">Lans</span>
              </div>
            </div>
            <CoverageChart data={coverage} />
          </Tile>
          <Tile className="xl:col-span-12">
            <div className="flex items-center justify-between">
              <div>
                <h3>En este momento</h3>
                <p className="text-muted-foreground">
                  Quien está en una sala ahora
                </p>
              </div>
              <Clock3
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-primary"
              />
            </div>
            {presences.length === 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                Nadie está asignado todavía.
              </p>
            )}
            <div className="mt-5 divide-y divide-border">
              {presences.map((presence) => (
                <div
                  key={presence.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-bold text-secondary">
                      {presence.roomName} · {presence.monitorName}
                    </p>
                    <small className="text-muted-foreground">
                      {shiftLabel(presence.startedAt, presence.leavesAt)}
                    </small>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void onClose(presence.id)}
                  >
                    Cerrar
                  </Button>
                </div>
              ))}
            </div>
          </Tile>
        </motion.div>
        <Dialog open={assigning} onOpenChange={setAssigning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar a una sala</DialogTitle>
              <DialogDescription>
                Hoy. La sala queda abierta entre la hora de entrada y la de
                salida.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onAssign} className="grid gap-3">
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="assign-room"
              >
                Sala
                <select
                  id="assign-room"
                  required
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Elige una sala</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · {room.locationName}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="text-sm font-bold text-secondary"
                htmlFor="assign-monitor"
              >
                Monitor
                <select
                  id="assign-monitor"
                  required
                  value={monitorId}
                  onChange={(event) => setMonitorId(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Elige un monitor</option>
                  {freeMonitors.map((monitor) => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className="text-sm font-bold text-secondary"
                  htmlFor="entry-time"
                >
                  Hora de entrada
                  <input
                    id="entry-time"
                    type="time"
                    required
                    value={entryTime}
                    onChange={(event) => setEntryTime(event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label
                  className="text-sm font-bold text-secondary"
                  htmlFor="exit-time"
                >
                  Hora de salida
                  <input
                    id="exit-time"
                    type="time"
                    required
                    value={exitTime}
                    onChange={(event) => setExitTime(event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
              {availableRooms.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todas las salas ya tienen dos monitores.
                </p>
              )}
              {freeMonitors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay monitores libres.
                </p>
              )}
              {formError && (
                <p className="text-sm font-bold text-primary">{formError}</p>
              )}
              <Button
                type="submit"
                disabled={
                  pending ||
                  availableRooms.length === 0 ||
                  freeMonitors.length === 0
                }
              >
                {pending ? "Asignando…" : "Asignar ahora"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardShell>
    </RequireRole>
  );
}

function Tile({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      className={`bento-panel p-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}
