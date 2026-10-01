export type AppRole = "coordinator" | "monitor";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export function isAppRole(value: string): value is AppRole {
  return value === "coordinator" || value === "monitor";
}
