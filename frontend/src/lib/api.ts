const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:3001";

export class ApiError extends Error {}

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "No se pudo contactar el servidor. Corre el backend con bun run api.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = body?.message;
    throw new ApiError(
      Array.isArray(message)
        ? message.join(" ")
        : (message ?? "La solicitud falló."),
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
