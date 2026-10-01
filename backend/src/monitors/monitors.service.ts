import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service.js";
import { throwDatabaseError } from "../supabase/supabase-error.js";

@Injectable()
export class MonitorsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase.client
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("role", "monitor")
      .order("full_name");
    if (error) throwDatabaseError(error);
    return data ?? [];
  }

  async create(fullName: string, email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "monitor", full_name: fullName },
    });
    if (error || !data.user) {
      throw new BadRequestException(monitorCreateMessage(error?.message));
    }
    const profile = await this.supabase.client
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile.error) throwDatabaseError(profile.error);
    if (!profile.data) {
      throw new BadRequestException("La cuenta se creó, pero no quedó el perfil del monitor.");
    }
    return profile.data;
  }

  async update(id: string, fullName: string, email: string, password?: string) {
    await this.requireMonitor(id);
    const payload: {
      email: string;
      password?: string;
      user_metadata: { role: "monitor"; full_name: string };
    } = {
      email,
      user_metadata: { role: "monitor", full_name: fullName },
    };
    if (password) payload.password = password;
    const updated = await this.supabase.client.auth.admin.updateUserById(id, payload);
    if (updated.error) {
      throw new BadRequestException(monitorCreateMessage(updated.error.message));
    }
    const profile = await this.supabase.client
      .from("profiles")
      .update({ full_name: fullName, email })
      .eq("id", id)
      .select("id, email, full_name, role")
      .single();
    if (profile.error) throwDatabaseError(profile.error);
    return profile.data;
  }

  async remove(id: string) {
    await this.requireMonitor(id);
    const removed = await this.supabase.client.auth.admin.deleteUser(id);
    if (removed.error) throw new BadRequestException(monitorCreateMessage(removed.error.message));
    return { id };
  }

  private async requireMonitor(id: string) {
    const profile = await this.supabase.client
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();
    if (profile.error) throwDatabaseError(profile.error);
    if (!profile.data || profile.data.role !== "monitor") {
      throw new NotFoundException("Ese monitor no existe.");
    }
  }
}

function monitorCreateMessage(message: string | undefined) {
  if (!message) return "No se pudo crear el monitor.";
  if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  return message;
}
