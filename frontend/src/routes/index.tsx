import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { TbMapPin, TbUsersGroup } from "react-icons/tb";
import { PublicHeader } from "@/components/app-shell";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  getLocations,
  getOpenRooms,
  type LocationItem,
  type OpenRoom,
} from "@/lib/board";
import { formatTime, formatToday, shiftLabel } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monitoría de Salas — Encuentra tu espacio" },
      {
        name: "description",
        content:
          "Consulta las salas de cómputo abiertas ahora en Sede Central y Sede Lans.",
      },
      {
        property: "og:title",
        content: "Monitoría de Salas — Encuentra tu espacio",
      },
      {
        property: "og:description",
        content: "Salas disponibles y monitores a cargo en este momento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [rooms, setRooms] = useState<OpenRoom[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getOpenRooms(), getLocations()])
      .then(([openRooms, campus]) => {
        if (!active) return;
        setRooms(openRooms);
        setLocations(campus);
        setUpdatedAt(new Date());
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
  }, []);

  const monitorsNow = rooms.reduce(
    (total, room) => total + room.monitors.length,
    0,
  );

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <PublicHeader />
      <main>
        <section className="relative flex min-h-[720px] items-center bg-secondary px-5 pb-20 pt-28 text-secondary-foreground md:px-8">
          <div
            className="absolute inset-y-0 right-0 hidden w-[42%] opacity-20 lg:block"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto grid w-full max-w-7xl items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <h1 className="max-w-4xl">
                Tu próxima gran idea necesita{" "}
                <span className="text-primary">un lugar.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base text-secondary-foreground/65">
                Encuentra una sala de cómputo abierta, llega con tu equipo y
                concéntrate en lo que importa.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#salas">Ver salas abiertas</a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/monitor">Soy monitor</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="col-span-2 bento-panel bg-background p-6 text-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-secondary">
                    Abiertas ahora
                  </span>
                  <small className="text-muted-foreground">
                    {updatedAt
                      ? `Actualizado ${formatTime(updatedAt)}`
                      : formatToday()}
                  </small>
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <strong className="text-6xl font-extrabold text-secondary">
                    {rooms.length}
                  </strong>
                  <span className="pb-2 text-sm text-muted-foreground">
                    salas disponibles
                  </span>
                </div>
              </div>
              <div className="bento-panel border-primary/30 bg-primary p-5 text-primary-foreground">
                <TbMapPin />
                <strong className="mt-8 block text-2xl">
                  {locations.length}
                </strong>
                <small>Sedes</small>
              </div>
              <div className="bento-panel bg-secondary-foreground/10 p-5 text-secondary-foreground backdrop-blur">
                <TbUsersGroup />
                <strong className="mt-8 block text-2xl">{monitorsNow}</strong>
                <small className="text-secondary-foreground/65">
                  En salas ahora
                </small>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="salas" className="px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="text-xs font-bold uppercase text-primary">
                  Disponibilidad en vivo
                </span>
                <h2 className="mt-2 text-secondary">Salas abiertas ahora</h2>
              </div>
              <p className="max-w-md text-muted-foreground">
                Elige tu sede y revisa quién te recibe. Una sala muestra a quien
                está ahora.
              </p>
            </div>
            {error && (
              <p className="mt-8 text-sm font-bold text-primary">{error}</p>
            )}
            {rooms.length === 0 && !error && (
              <p className="mt-10 text-muted-foreground">
                No hay salas abiertas en este momento.
              </p>
            )}
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  name={room.name}
                  features={room.features}
                  locationName={room.locationName}
                  monitors={room.monitors}
                  since={shiftLabel(
                    room.monitors.reduce(
                      (earliest, monitor) =>
                        monitor.startedAt < earliest ? monitor.startedAt : earliest,
                      room.monitors[0]?.startedAt ?? new Date().toISOString(),
                    ),
                    room.monitors.every((monitor) => monitor.leavesAt)
                      ? room.monitors.reduce(
                          (latest, monitor) =>
                            monitor.leavesAt && monitor.leavesAt > latest
                              ? monitor.leavesAt
                              : latest,
                          room.monitors[0]?.leavesAt ?? "",
                        )
                      : null,
                  )}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
