import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { PiNotePencil } from "react-icons/pi";
import {
  TbCalendar,
  TbCircleCheck,
  TbClock,
  TbDoorEnter,
  TbDoorExit,
  TbMapPin,
} from "react-icons/tb";
import { DashboardShell } from "@/components/app-shell";
import { RequireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { rooms, shifts } from "@/lib/monitoring-data";

export const Route = createFileRoute("/monitor")({
  head: () => ({
    meta: [
      { title: "Mis turnos — Monitoría de Salas" },
      {
        name: "description",
        content: "Calendario, check-in y novedades del monitor de salas.",
      },
      { property: "og:title", content: "Mis turnos — Monitoría de Salas" },
      {
        property: "og:description",
        content: "Agenda personal y control de turnos de monitoría.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitorPage,
});

function MonitorPage() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const myShifts = shifts.filter((shift) => shift.monitorId === "m1");
  const current = myShifts[0];
  const room = rooms.find((item) => item.id === current?.roomId);

  return (
    <RequireRole role="monitor">
      <DashboardShell role="Monitor" title="Hola, Laura">
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
              Tu turno de hoy
            </small>
            <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <h2>{room?.name}</h2>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-secondary-foreground/65">
                  <span className="flex items-center gap-2">
                    <TbMapPin size={16} />
                    Sede Central
                  </span>
                  <span className="flex items-center gap-2">
                    <TbClock size={16} />
                    8:00 a. m. — 12:00 p. m.
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setCheckedIn(!checkedIn)}
                className={
                  checkedIn
                    ? "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
                    : ""
                }
              >
                {checkedIn ? (
                  <>
                    <TbDoorExit />
                    Hacer check-out
                  </>
                ) : (
                  <>
                    <TbDoorEnter />
                    Hacer check-in
                  </>
                )}
              </Button>
            </div>
            {checkedIn && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 flex items-center gap-2 border-t border-secondary-foreground/15 pt-5 text-sm font-bold text-secondary-foreground"
              >
                <TbCircleCheck className="text-primary" /> Check-in registrado a
                las 8:04 a. m.
              </motion.div>
            )}
          </Panel>
          <Panel className="xl:col-span-5">
            <TbCalendar className="text-primary" />
            <strong className="mt-7 block text-4xl text-secondary">12 h</strong>
            <p className="font-bold text-secondary">Asignadas esta semana</p>
            <small className="text-muted-foreground">3 turnos · 2 salas</small>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 bg-primary" />
            </div>
          </Panel>
          <Panel className="xl:col-span-8">
            <div>
              <h3>Mi semana</h3>
              <p className="text-muted-foreground">
                Turnos del 28 sep. al 4 oct.
              </p>
            </div>
            <div className="mt-7 grid grid-cols-5 gap-2 overflow-x-auto">
              {["Lun 28", "Mar 29", "Mié 30", "Jue 01", "Vie 02"].map(
                (day, index) => (
                  <div
                    key={day}
                    className={`min-w-24 border p-3 ${index === 3 ? "border-primary bg-accent" : "border-border"}`}
                  >
                    <small className="font-bold text-muted-foreground">
                      {day}
                    </small>
                    {index === 3 ? (
                      <div className="mt-8">
                        <p className="font-bold text-secondary">C-201</p>
                        <small>8:00 — 12:00</small>
                      </div>
                    ) : index === 1 ? (
                      <div className="mt-8">
                        <p className="font-bold text-secondary">L-102</p>
                        <small>14:00 — 18:00</small>
                      </div>
                    ) : (
                      <p className="mt-10 text-xs text-muted-foreground">
                        Sin turno
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </Panel>
          <Panel className="xl:col-span-4">
            <div className="flex items-center gap-3">
              <PiNotePencil size={22} className="text-primary" />
              <div>
                <h3>Novedad de sala</h3>
                <p className="text-muted-foreground">Antes de salir</p>
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
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
              placeholder="Ej. Faltan 2 mouses en la sala..."
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
            <Button
              variant="navy"
              className="mt-3 w-full"
              disabled={!note.trim()}
              onClick={() => setSaved(true)}
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
          </Panel>
          <Panel className="xl:col-span-12">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3>Próximo turno</h3>
                <p className="text-muted-foreground">
                  Sábado 03 de octubre · Sala C-201
                </p>
              </div>
              <div className="flex items-center gap-3 border-l-2 border-primary pl-4">
                <TbClock className="text-primary" />
                <div>
                  <small className="text-muted-foreground">Horario</small>
                  <p className="font-bold text-secondary">
                    2:00 p. m. — 6:00 p. m.
                  </p>
                </div>
              </div>
            </div>
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
