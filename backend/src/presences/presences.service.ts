import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Profile } from "../auth/profile.js";
import { embeddedText } from "../supabase/embed.js";
import { SupabaseService } from "../supabase/supabase.service.js";
import { throwDatabaseError } from "../supabase/supabase-error.js";

@Injectable()
export class PresencesService {
  constructor(private readonly supabase: SupabaseService) {}

  async open() {
    const withHours = await this.supabase.client
      .from("presences")
      .select("id, room_id, monitor_id, started_at, leaves_at, profiles(full_name), rooms(name)")
      .is("ended_at", null)
      .order("started_at");
    if (withHours.error && missingLeavesColumn(withHours.error.message)) {
      const plain = await this.supabase.client
        .from("presences")
        .select("id, room_id, monitor_id, started_at, profiles(full_name), rooms(name)")
        .is("ended_at", null)
        .order("started_at");
      if (plain.error) throwDatabaseError(plain.error);
      return (plain.data ?? []).map((row) => this.toOpen(row, null));
    }
    if (withHours.error) throwDatabaseError(withHours.error);
    return (withHours.data ?? []).map((row) => this.toOpen(row, row.leaves_at));
  }

  async mine(user: Profile) {
    const withHours = await this.supabase.client
      .from("presences")
      .select("id, room_id, started_at, leaves_at, ended_at, rooms(name, locations(name))")
      .eq("monitor_id", user.id)
      .order("started_at", { ascending: false });
    const plain = missingLeavesColumn(withHours.error?.message ?? "")
      ? await this.supabase.client
          .from("presences")
          .select("id, room_id, started_at, ended_at, rooms(name, locations(name))")
          .eq("monitor_id", user.id)
          .order("started_at", { ascending: false })
      : withHours;
    if (plain.error) throwDatabaseError(plain.error);
    const data = (plain.data ?? []).map((row) => ({
      ...row,
      leaves_at: "leaves_at" in row ? row.leaves_at : null,
    }));

    const open = (data ?? []).find((row) => row.ended_at === null);
    let partnerName: string | null = null;
    if (open) {
      const others = await this.supabase.client
        .from("presences")
        .select("profiles(full_name)")
        .eq("room_id", open.room_id)
        .is("ended_at", null)
        .neq("monitor_id", user.id);
      if (others.error) throwDatabaseError(others.error);
      partnerName = embeddedText(others.data?.[0]?.profiles, "full_name") || null;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      roomName: embeddedText(row.rooms, "name"),
      locationName: embeddedText(
        row.rooms && typeof row.rooms === "object" && "locations" in row.rooms
          ? row.rooms.locations
          : null,
        "name",
      ),
      startedAt: row.started_at,
      leavesAt: row.leaves_at ?? null,
      endedAt: row.ended_at,
      partnerName: open && row.id === open.id ? partnerName : null,
    }));
  }

  async assign(roomId: string, monitorId: string, startedAt: string, leavesAt: string) {
    const start = new Date(startedAt);
    const leave = new Date(leavesAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(leave.getTime()) || leave <= start) {
      throw new BadRequestException("La hora de salida tiene que ser después de la entrada.");
    }

    const monitor = await this.supabase.client
      .from("profiles")
      .select("id, role")
      .eq("id", monitorId)
      .maybeSingle();
    if (monitor.error) throwDatabaseError(monitor.error);
    if (!monitor.data || monitor.data.role !== "monitor") {
      throw new BadRequestException("Solo se puede asignar a un monitor.");
    }

    const created = await this.supabase.client
      .from("presences")
      .insert({
        room_id: roomId,
        monitor_id: monitorId,
        started_at: start.toISOString(),
        leaves_at: leave.toISOString(),
      })
      .select("id, room_id, monitor_id, started_at")
      .single();
    if (created.error) {
      if (missingLeavesColumn(created.error.message)) {
        throw new BadRequestException(
          "Falta aplicar en Supabase el archivo supabase/migrations/20261001190000_presence_hours.sql para guardar la hora de salida.",
        );
      }
      throwDatabaseError(created.error);
    }
    return created.data;
  }

  async close(presenceId: string, user: Profile) {
    let query = this.supabase.client
      .from("presences")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", presenceId)
      .is("ended_at", null);
    if (user.role === "monitor") query = query.eq("monitor_id", user.id);

    const { data, error } = await query.select("id, room_id, monitor_id, started_at, ended_at").maybeSingle();
    if (error) throwDatabaseError(error);
    if (!data) throw new NotFoundException("Esa asignación no está abierta.");
    return data;
  }

  private toOpen(
    row: {
      id: string;
      room_id: string;
      rooms: unknown;
      monitor_id: string;
      profiles: unknown;
      started_at: string;
    },
    leavesAt: string | null,
  ) {
    return {
      id: row.id,
      roomId: row.room_id,
      roomName: embeddedText(row.rooms, "name"),
      monitorId: row.monitor_id,
      monitorName: embeddedText(row.profiles, "full_name"),
      startedAt: row.started_at,
      leavesAt,
    };
  }
}

function missingLeavesColumn(message: string) {
  return message.includes("leaves_at");
}
