import { ForbiddenException, Injectable } from "@nestjs/common";
import type { Profile } from "../auth/profile.js";
import { embeddedText } from "../supabase/embed.js";
import { SupabaseService } from "../supabase/supabase.service.js";
import { throwDatabaseError } from "../supabase/supabase-error.js";

@Injectable()
export class ObservationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase.client
      .from("observations")
      .select("id, body, created_at, presences(rooms(name), profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => {
      const presence = Array.isArray(row.presences) ? row.presences[0] : row.presences;
      return {
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        roomName: embeddedText(presence?.rooms, "name"),
        monitorName: embeddedText(presence?.profiles, "full_name"),
      };
    });
  }

  async create(user: Profile, presenceId: string, body: string) {
    const presence = await this.supabase.client
      .from("presences")
      .select("id, monitor_id, ended_at")
      .eq("id", presenceId)
      .maybeSingle();
    if (presence.error) throwDatabaseError(presence.error);
    if (!presence.data || presence.data.ended_at || presence.data.monitor_id !== user.id) {
      throw new ForbiddenException("Solo puedes dejar una novedad en tu sala abierta.");
    }

    const created = await this.supabase.client
      .from("observations")
      .insert({ presence_id: presenceId, body: body.trim() })
      .select("id, presence_id, body, created_at")
      .single();
    if (created.error) throwDatabaseError(created.error);
    return created.data;
  }
}
