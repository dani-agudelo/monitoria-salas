import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly url: string;
  readonly secretKey: string;

  constructor(config: ConfigService) {
    const url = config.get<string>("SUPABASE_URL");
    const secretKey = config.get<string>("SUPABASE_SECRET_KEY");
    if (!url || !secretKey) {
      throw new Error(
        "Define SUPABASE_URL y SUPABASE_SECRET_KEY en backend/.env.",
      );
    }
    this.url = url;
    this.secretKey = secretKey;
    this.client = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
}
