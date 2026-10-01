import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";

export function throwDatabaseError(error: { message: string }): never {
  const offline =
    error.message.includes("fetch failed") || error.message.includes("Failed to fetch");
  if (offline) {
    throw new ServiceUnavailableException(
      "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SECRET_KEY.",
    );
  }
  throw new BadRequestException(error.message);
}
