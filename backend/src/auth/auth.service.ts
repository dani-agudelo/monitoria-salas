import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { isAppRole, type Profile } from "./profile.js";
import { SupabaseService } from "../supabase/supabase.service.js";
import { throwDatabaseError } from "../supabase/supabase-error.js";

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    const client = this.sessionClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session || !data.user) {
      if (isOffline(error)) {
        throw new ServiceUnavailableException(
          "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SECRET_KEY.",
        );
      }
      throw new UnauthorizedException("Correo o contraseña incorrectos.");
    }
    const profile = await this.profileOf(data.user.id);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      profile,
    };
  }

  async refresh(refreshToken: string) {
    const client = this.sessionClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) {
      if (isOffline(error)) {
        throw new ServiceUnavailableException(
          "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SECRET_KEY.",
        );
      }
      throw new UnauthorizedException("La sesión expiró. Vuelve a ingresar.");
    }
    const profile = await this.profileOf(data.user.id);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      profile,
    };
  }

  async profileFromAccessToken(accessToken: string) {
    const { data, error } =
      await this.supabase.client.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new UnauthorizedException("La sesión no es válida.");
    }
    return this.profileOf(data.user.id);
  }

  async logout(accessToken: string) {
    const { error } =
      await this.supabase.client.auth.admin.signOut(accessToken);
    if (error) throw new UnauthorizedException("No se pudo cerrar la sesión.");
  }

  private sessionClient() {
    return createClient(this.supabase.url, this.supabase.secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  private async profileOf(userId: string): Promise<Profile> {
    const { data, error } = await this.supabase.client
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throwDatabaseError(error);
    if (!data || !isAppRole(data.role)) {
      throw new UnauthorizedException(
        "La cuenta no tiene un perfil de monitoría.",
      );
    }
    return data;
  }
}

function isOffline(error: { message: string; name?: string } | null) {
  if (!error) return false;
  return (
    error.name === "AuthRetryableFetchError" ||
    error.message.includes("fetch failed") ||
    error.message.includes("Failed to fetch")
  );
}
