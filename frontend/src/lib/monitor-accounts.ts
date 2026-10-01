import { api } from "@/lib/api";

export type MonitorAccount = {
  id: string;
  email: string;
  full_name: string;
  role: "monitor";
};

export type NewMonitorAccount = {
  fullName: string;
  email: string;
  password: string;
};

export function listMonitors(token: string) {
  return api<MonitorAccount[]>("/monitors", { token });
}

export function createMonitor(token: string, account: NewMonitorAccount) {
  return api<MonitorAccount>("/monitors", {
    method: "POST",
    token,
    body: JSON.stringify(account),
  });
}

export function updateMonitor(
  token: string,
  id: string,
  account: { fullName: string; email: string; password?: string },
) {
  return api<MonitorAccount>(`/monitors/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(account),
  });
}

export function deleteMonitor(token: string, id: string) {
  return api<{ id: string }>(`/monitors/${id}`, { method: "DELETE", token });
}
