import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { embeddedText } from "../supabase/embed.js";
import { SupabaseService } from "../supabase/supabase.service.js";
import { throwDatabaseError } from "../supabase/supabase-error.js";
import type { SaveRoomDto } from "./dto/save-room.dto.js";

type OpenRow = {
  room_id: string;
  room_name: string;
  capacity: number;
  features: string[];
  location_id: string;
  location_name: string;
  presence_id: string;
  started_at: string;
  leaves_at: string | null;
  monitor_id: string;
  monitor_name: string;
};

@Injectable()
export class RoomsService {
  constructor(private readonly supabase: SupabaseService) {}

  async openRooms() {
    const { data, error } = await this.supabase.client.from("open_rooms").select("*");
    if (error) throwDatabaseError(error);
    const rooms = new Map<
      string,
      {
        id: string;
        name: string;
        capacity: number;
        features: string[];
        locationId: string;
        locationName: string;
        monitors: { presenceId: string; id: string; name: string; startedAt: string; leavesAt: string | null }[];
      }
    >();
    for (const row of (data ?? []) as OpenRow[]) {
      const current = rooms.get(row.room_id) ?? {
        id: row.room_id,
        name: row.room_name,
        capacity: row.capacity,
        features: row.features,
        locationId: row.location_id,
        locationName: row.location_name,
        monitors: [],
      };
      current.monitors.push({
        presenceId: row.presence_id,
        id: row.monitor_id,
        name: row.monitor_name,
        startedAt: row.started_at,
        leavesAt: row.leaves_at,
      });
      rooms.set(row.room_id, current);
    }
    return [...rooms.values()];
  }

  async locations() {
    const { data, error } = await this.supabase.client
      .from("locations")
      .select("id, name")
      .order("name");
    if (error) throwDatabaseError(error);
    return data ?? [];
  }

  async list() {
    const { data, error } = await this.supabase.client
      .from("rooms")
      .select("id, name, capacity, features, location_id, locations(name)")
      .order("name");
    if (error) throwDatabaseError(error);
    return (data ?? []).map((room) => this.mapRoom(room));
  }

  async create(input: SaveRoomDto) {
    await this.requireLocation(input.locationId);
    const id = await this.uniqueId(input.name);
    const created = await this.supabase.client
      .from("rooms")
      .insert({
        id,
        name: input.name.trim(),
        location_id: input.locationId,
        capacity: input.capacity,
        features: input.features ?? [],
      })
      .select("id, name, capacity, features, location_id, locations(name)")
      .single();
    if (created.error) throwDatabaseError(created.error);
    return this.mapRoom(created.data);
  }

  async update(id: string, input: SaveRoomDto) {
    await this.requireLocation(input.locationId);
    const updated = await this.supabase.client
      .from("rooms")
      .update({
        name: input.name.trim(),
        location_id: input.locationId,
        capacity: input.capacity,
        features: input.features ?? [],
      })
      .eq("id", id)
      .select("id, name, capacity, features, location_id, locations(name)")
      .maybeSingle();
    if (updated.error) throwDatabaseError(updated.error);
    if (!updated.data) throw new NotFoundException("Esa sala no existe.");
    return this.mapRoom(updated.data);
  }

  async remove(id: string) {
    const used = await this.supabase.client
      .from("presences")
      .select("id", { count: "exact", head: true })
      .eq("room_id", id);
    if (used.error) throwDatabaseError(used.error);
    if ((used.count ?? 0) > 0) {
      throw new BadRequestException("Esta sala tiene asignaciones y no se puede eliminar.");
    }
    const removed = await this.supabase.client.from("rooms").delete().eq("id", id).select("id").maybeSingle();
    if (removed.error) throwDatabaseError(removed.error);
    if (!removed.data) throw new NotFoundException("Esa sala no existe.");
    return { id };
  }

  private mapRoom(room: {
    id: string;
    name: string;
    capacity: number;
    features: string[] | null;
    location_id: string;
    locations: unknown;
  }) {
    return {
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      features: room.features ?? [],
      locationId: room.location_id,
      locationName: embeddedText(room.locations, "name"),
    };
  }

  private async requireLocation(locationId: string) {
    const location = await this.supabase.client
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .maybeSingle();
    if (location.error) throwDatabaseError(location.error);
    if (!location.data) throw new BadRequestException("Esa sede no existe.");
  }

  private async uniqueId(name: string) {
    const base =
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20) || "sala";
    const existing = await this.supabase.client.from("rooms").select("id");
    if (existing.error) throwDatabaseError(existing.error);
    const taken = new Set((existing.data ?? []).map((room) => room.id));
    if (!taken.has(base)) return base;
    let suffix = 2;
    while (taken.has(`${base}${suffix}`)) suffix += 1;
    return `${base}${suffix}`;
  }

  async coverage() {
    const weekStart = mondayInBogota();
    const { data, error } = await this.supabase.client
      .from("presences")
      .select("started_at, ended_at, rooms(location_id)")
      .gte("started_at", weekStart);
    if (error) throwDatabaseError(error);

    const totals = new Map<string, { Central: number; Lans: number }>(
      ["Lun", "Mar", "Mié", "Jue", "Vie"].map((day) => [day, { Central: 0, Lans: 0 }]),
    );

    for (const row of data ?? []) {
      const weekday = bogotaWeekday(new Date(row.started_at));
      const bucket = weekday ? totals.get(weekday) : undefined;
      const locationId = embeddedText(row.rooms, "location_id");
      const series = locationId === "lans" ? "Lans" : locationId === "central" ? "Central" : null;
      if (!bucket || !series) continue;
      const end = row.ended_at ? new Date(row.ended_at) : new Date();
      const hours = Math.max(0, (end.getTime() - new Date(row.started_at).getTime()) / 3_600_000);
      bucket[series] = Math.round((bucket[series] + hours) * 10) / 10;
    }

    return [...totals.entries()].map(([day, series]) => ({ day, ...series }));
  }
}

function bogotaWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
  }).format(date);
  const labels: Record<string, string> = {
    Mon: "Lun",
    Tue: "Mar",
    Wed: "Mié",
    Thu: "Jue",
    Fri: "Vie",
  };
  return labels[weekday];
}

function mondayInBogota(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  const daysFromMonday = index <= 0 ? (index === 0 ? 6 : 0) : index - 1;
  const midnight = new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00-05:00`);
  midnight.setTime(midnight.getTime() - daysFromMonday * 86_400_000);
  return midnight.toISOString();
}
