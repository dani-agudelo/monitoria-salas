import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { PiNotePencil } from "react-icons/pi";
import { TbCircleCheck, TbClock, TbDoorExit, TbMapPin } from "react-icons/tb";
import { DashboardShell } from "@/components/app-shell";
import { RequireRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  closePresence,
  myPresences,
  saveNote,
  type MyPresence,
} from "@/lib/board";
import {
  bogotaDayKey,
  currentWeekDays,
  hoursBetween,
  shiftLabel,
} from "@/lib/format";

export const Route = createFileRoute("/monitor")({
  head: () => ({
    meta: [
      { title: "Mis turnos — Monitoría de Salas" },
      { name: "description", content: "Sala actual y novedades del monitor." },
      { property: "og:title", content: "Mis turnos — Monitoría de Salas" },
      {
        property: "og:description",
        content: "Sala asignada y novedades del monitor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitorPage,
});

function MonitorPage() {
  const { profile, session } = useAuth();
  const [presences, setPresences] = useState<MyPresence[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const current = presences.find((item) => item.endedAt === null);
  const week = currentWeekDays();
  const weekKeys = new Set(week.map((day) => day.key));
  const weekPresences = presences.filter((item) =>
    weekKeys.has(bogotaDayKey(item.startedAt)),
  );
  const weekHours = weekPresences.reduce(
    (total, item) => total + hoursBetween(item.startedAt, item.endedAt),
    0,
  );
  const weekRooms = new Set(weekPresences.map((item) => item.roomId)).size;

  useEffect(() => {
    if (!session || profile?.role !== "monitor") return;
    let active = true;
    myPresences(session.accessToken)
      .then((rows) => {
        if (active) setPresences(rows);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "No se pudo cargar tu sala.",
        );
      });
    return () => {
      active = false;
    };
  }, [profile, session]);

  async function leaveRoom() {
    if (!session || !current) return;
    setPending(true);
    setError(null);
    try {
      await closePresence(session.accessToken, current.id);
      setPresences(await myPresences(session.accessToken));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo cerrar la sala.",
      );
    } finally {
      setPending(false);
    }
  }

  async function keepNote() {
    if (!session || !current || !note.trim()) return;
    setPending(true);
    setError(null);
    try {
      await saveNote(session.accessToken, current.id, note.trim());
      setSaved(true);
      setNote("");
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo guardar la novedad.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <RequireRole role="monitor">
      <DashboardShell
        role="Monitor"
        title={`Hola, ${profile?.full_name ?? ""}`}
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } },
          }}
          className="grid grid-cols-1 gap-5 xl:grid-cols-12"
        >
          <Panel className="bg-secondary text-secondary-foreground xl:col-span-7">
            <small className="font-bold uppercase text-primary">
              Tu sala ahora
            </small>
            {current ? (
              <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div>
                  <h2>{current.roomName}</h2>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-secondary-foreground/65">
                    <span className="flex items-center gap-2">
                      <TbMapPin size={16} />
                      {current.locationName}
                    </span>
                    <span className="flex items-center gap-2">
                      <TbClock size={16} />
                      {shiftLabel(current.startedAt, current.leavesAt)}
                    </span>
                    {current.partnerName && (
                      <span>Con {current.partnerName}</span>
                    )}
                  </div>
                </div>
                <Button onClick={() => void leaveRoom()} disabled={pending}>
                  <TbDoorExit />
                  Salir de la sala
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <h2>Sin sala asignada</h2>
                <p className="mt-4 max-w-md text-sm text-secondary-foreground/65">
                  Cuando llegues, coordinación te ubica en una sala. No hay
                  horario armado de antemano.
                </p>
              </div>
            )}
          </Panel>
          <Panel className="xl:col-span-5">
            <strong className="block text-4xl text-secondary">
              {weekHours.toFixed(1)} h
            </strong>
            <p className="font-bold text-secondary">Esta semana</p>
            <small className="text-muted-foreground">
              {weekPresences.length} asignaciones · {weekRooms} salas
            </small>
          </Panel>
          <Panel className="xl:col-span-8">
            <div>
              <h3>Esta semana</h3>
              <p className="text-muted-foreground">
                Salas en las que estuviste, de lunes a viernes
              </p>
            </div>
            <div className="mt-7 grid grid-cols-5 gap-2 overflow-x-auto">
              {week.map((day) => {
                const match = weekPresences.find(
                  (item) => bogotaDayKey(item.startedAt) === day.key,
                );
                const isToday =
                  day.key === bogotaDayKey(new Date().toISOString());
                return (
                  <div
                    key={day.key}
                    className={`min-w-24 border p-3 ${isToday ? "border-primary bg-accent" : "border-border"}`}
                  >
                    <small className="font-bold text-muted-foreground">
                      {day.label}
                    </small>
                    {match ? (
                      <div className="mt-8">
                        <p className="font-bold text-secondary">
                          {match.roomName}
                        </p>
                        <small>{shiftLabel(match.startedAt, match.leavesAt)}</small>
                      </div>
                    ) : (
                      <p className="mt-10 text-xs text-muted-foreground">
                        Sin sala
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel className="xl:col-span-4">
            <div className="flex items-center gap-3">
              <PiNotePencil size={22} className="text-primary" />
              <div>
                <h3>Novedad de sala</h3>
                <p className="text-muted-foreground">
                  Una nota de lo que pasa en la sala
                </p>
              </div>
            </div>
            <label
              className="mt-6 block text-xs font-bold uppercase text-secondary"
              htmlFor="note"
            >
              Observación
            </label>
            <textarea
              id="note"
              value={note}
              disabled={!current}
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
              placeholder={
                current
                  ? "Ej. Faltan 2 mouses en la sala..."
                  : "Disponible cuando estés en una sala"
              }
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
            <Button
              variant="navy"
              className="mt-3 w-full"
              disabled={!current || !note.trim() || pending}
              onClick={() => void keepNote()}
            >
              {saved ? (
                <>
                  <TbCircleCheck />
                  Guardada
                </>
              ) : (
                "Guardar observación"
              )}
            </Button>
            {error && (
              <p className="mt-3 text-sm font-bold text-primary">{error}</p>
            )}
          </Panel>
        </motion.div>
      </DashboardShell>
    </RequireRole>
  );
}

function Panel({
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
