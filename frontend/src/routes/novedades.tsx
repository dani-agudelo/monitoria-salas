import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/app-shell";
import { RequireRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { listNotes, type RoomNote } from "@/lib/board";
import { formatTime, formatToday } from "@/lib/format";

export const Route = createFileRoute("/novedades")({
  head: () => ({
    meta: [
      { title: "Novedades — Monitoría de Salas" },
      {
        name: "description",
        content: "Novedades que dejan los monitores mientras están en sala.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { session, profile } = useAuth();
  const [notes, setNotes] = useState<RoomNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || profile?.role !== "coordinator") return;
    let active = true;
    listNotes(session.accessToken)
      .then((items) => {
        if (active) setNotes(items);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las novedades.");
      });
    return () => {
      active = false;
    };
  }, [profile, session]);

  return (
    <RequireRole role="coordinator">
      <DashboardShell role="Coordinación" title="Novedades">
        <section className="bento-panel p-6">
          <small className="font-bold uppercase text-primary">Hoy · {formatToday()}</small>
          <h2 className="mt-3 text-secondary">Lo que reportan en sala</h2>
          <p className="mt-2 text-muted-foreground">
            Notas que escribe el monitor mientras está asignado.
          </p>
          {error && <p className="mt-6 text-sm font-bold text-primary">{error}</p>}
          {notes.length === 0 && !error && (
            <p className="mt-8 text-sm text-muted-foreground">Todavía no hay novedades.</p>
          )}
          <div className="mt-6 divide-y divide-border">
            {notes.map((note) => (
              <article key={note.id} className="py-4">
                <p className="font-bold text-secondary">
                  {note.roomName} · {note.monitorName}
                </p>
                <small className="text-muted-foreground">{formatTime(note.createdAt)}</small>
                <p className="mt-2 text-sm text-muted-foreground">{note.body}</p>
              </article>
            ))}
          </div>
        </section>
      </DashboardShell>
    </RequireRole>
  );
}
