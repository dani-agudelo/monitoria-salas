import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  CalendarPlus,
  Clock3,
  MoreHorizontal,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardShell } from "@/components/app-shell";
import { RequireRole } from "@/lib/auth";
import { CoverageChart } from "@/components/coverage-chart";
import { Button } from "@/components/ui/button";
import { rooms, shifts, users } from "@/lib/monitoring-data";

export const Route = createFileRoute("/coordinacion")({
  head: () => ({
    meta: [
      { title: "Panel de Coordinación — Monitoría de Salas" },
      {
        name: "description",
        content:
          "Gestión de monitores, turnos, ocupación y observaciones de las salas.",
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

const monitorUsers = users.filter((user) => user.role === "monitor");

function CoordinatorPage() {
  return (
    <RequireRole role="coordinator">
      <DashboardShell role="Coordinación" title="Resumen operativo">
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
                Hoy · Jueves 01
              </small>
              <h2 className="mt-3">Todo bajo control.</h2>
              <p className="mt-3 max-w-sm text-secondary-foreground/60">
                Tres salas están operando y todos los turnos activos tienen
                monitor asignado.
              </p>
            </div>
            <div className="mt-10 flex gap-8">
              <div>
                <strong className="text-3xl">03</strong>
                <small className="block text-secondary-foreground/55">
                  abiertas
                </small>
              </div>
              <div>
                <strong className="text-3xl">04</strong>
                <small className="block text-secondary-foreground/55">
                  turnos hoy
                </small>
              </div>
            </div>
          </Tile>
          <Tile className="xl:col-span-3">
            <div className="flex items-center gap-3">
              <Building2 size={22} strokeWidth={1.5} className="text-primary" />
              <p className="font-bold text-secondary">Salas registradas</p>
            </div>
            <strong className="mt-6 block text-4xl text-secondary">4</strong>
            <small className="text-muted-foreground">
              2 sedes universitarias
            </small>
          </Tile>
          <Tile className="xl:col-span-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users size={22} strokeWidth={1.5} className="text-primary" />
                <p className="font-bold text-secondary">Monitores activos</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Opciones">
                <MoreHorizontal size={22} strokeWidth={1.5} />
              </Button>
            </div>
            <strong className="mt-6 block text-4xl text-secondary">42</strong>
            <p className="font-bold text-secondary">Monitores activos</p>
            <small className="text-muted-foreground">
              8 con turno asignado esta semana
            </small>
          </Tile>
          <Tile className="xl:col-span-8">
            <div className="flex items-start justify-between">
              <div>
                <h3>Cobertura de horas</h3>
                <p className="text-muted-foreground">
                  Horas de monitoría por sede, de lunes a viernes
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-secondary">Central</span>
                <span className="text-primary">Lans</span>
              </div>
            </div>
            <CoverageChart />
          </Tile>
          <Tile className="xl:col-span-4">
            <div className="flex items-center gap-3">
              <CalendarPlus
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-primary"
              />
              <div>
                <h3>Acciones rápidas</h3>
                <p className="text-muted-foreground">Gestión del día</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <Button className="w-full justify-between">
                Crear nuevo turno
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between [&_svg]:size-[22px]"
              >
                Añadir monitor <UserPlus size={22} strokeWidth={1.5} />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between [&_svg]:size-[22px]"
              >
                Registrar novedad <TriangleAlert size={22} strokeWidth={1.5} />
              </Button>
            </div>
          </Tile>
          <Tile className="xl:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3>Próximos turnos</h3>
                <p className="text-muted-foreground">Agenda operativa de hoy</p>
              </div>
              <Clock3
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-primary"
              />
            </div>
            <div className="mt-5 divide-y divide-border">
              {shifts.slice(0, 4).map((shift) => {
                const room = rooms.find((item) => item.id === shift.roomId);
                const monitor = users.find(
                  (item) => item.id === shift.monitorId,
                );
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="font-bold text-secondary">
                        {room?.name} · {monitor?.name}
                      </p>
                      <small className="text-muted-foreground">
                        {new Date(shift.startTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        —{" "}
                        {new Date(shift.endTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <small className="font-bold uppercase text-primary">
                      {shift.status === "active" ? "Activo" : "Próximo"}
                    </small>
                  </div>
                );
              })}
            </div>
          </Tile>
          <Tile className="xl:col-span-5">
            <div className="flex items-center justify-between">
              <div>
                <h3>Equipo de monitoría</h3>
                <p className="text-muted-foreground">
                  Vista rápida de disponibilidad
                </p>
              </div>
              <span className="rounded-xl bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                42 total
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {monitorUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-slate-100/50 p-3"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-xs font-bold text-secondary-foreground">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <p className="mt-3 truncate font-bold text-secondary">
                    {user.name}
                  </p>
                  <small className="text-muted-foreground">
                    {index < 3 ? "En turno" : "Disponible"}
                  </small>
                </div>
              ))}
            </div>
          </Tile>
        </motion.div>
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
