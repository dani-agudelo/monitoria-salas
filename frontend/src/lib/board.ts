import { api } from "@/lib/api";
import { listMonitors, type MonitorAccount } from "@/lib/monitor-accounts";

export type OpenRoom = {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  locationId: string;
  locationName: string;
  monitors: {
    presenceId: string;
    id: string;
    name: string;
    startedAt: string;
    leavesAt: string | null;
  }[];
};

export type LocationItem = { id: string; name: string };

export type CatalogRoom = {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  locationId: string;
  locationName: string;
};

export type OpenPresence = {
  id: string;
  roomId: string;
  roomName: string;
  monitorId: string;
  monitorName: string;
  startedAt: string;
  leavesAt: string | null;
};

export type MyPresence = {
  id: string;
  roomId: string;
  roomName: string;
  locationName: string;
  startedAt: string;
  leavesAt: string | null;
  endedAt: string | null;
  partnerName: string | null;
};

export type CoveragePoint = { day: string; Central: number; Lans: number };

export type RoomNote = {
  id: string;
  body: string;
  createdAt: string;
  roomName: string;
  monitorName: string;
};

export function getOpenRooms() {
  return api<OpenRoom[]>("/rooms/open");
}

export function getLocations() {
  return api<LocationItem[]>("/rooms/locations");
}

export function listRooms(token: string) {
  return api<CatalogRoom[]>("/rooms", { token });
}

export type RoomInput = {
  name: string;
  locationId: string;
  capacity: number;
  features: string[];
};

export function createRoom(token: string, room: RoomInput) {
  return api<CatalogRoom>("/rooms", {
    method: "POST",
    token,
    body: JSON.stringify(room),
  });
}

export function updateRoom(token: string, id: string, room: RoomInput) {
  return api<CatalogRoom>(`/rooms/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(room),
  });
}

export function deleteRoom(token: string, id: string) {
  return api<{ id: string }>(`/rooms/${id}`, { method: "DELETE", token });
}

export function getCoverage(token: string) {
  return api<CoveragePoint[]>("/rooms/coverage", { token });
}

export function listOpenPresences(token: string) {
  return api<OpenPresence[]>("/presences", { token });
}

export function assignMonitor(
  token: string,
  input: {
    roomId: string;
    monitorId: string;
    startedAt: string;
    leavesAt: string;
  },
) {
  return api("/presences", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function closePresence(token: string, presenceId: string) {
  return api(`/presences/${presenceId}/close`, { method: "PATCH", token });
}

export function myPresences(token: string) {
  return api<MyPresence[]>("/presences/mine", { token });
}

export function listNotes(token: string) {
  return api<RoomNote[]>("/observations", { token });
}

export function saveNote(token: string, presenceId: string, body: string) {
  return api("/observations", {
    method: "POST",
    token,
    body: JSON.stringify({ presenceId, body }),
  });
}

export function loadCoordinatorBoard(token: string) {
  return Promise.all([
    listMonitors(token),
    listRooms(token),
    listOpenPresences(token),
    getCoverage(token),
    getLocations(),
  ]).then(([monitors, rooms, presences, coverage, locations]) => ({
    monitors,
    rooms,
    presences,
    coverage,
    locations,
  }));
}

export type CoordinatorBoard = {
  monitors: MonitorAccount[];
  rooms: CatalogRoom[];
  presences: OpenPresence[];
  coverage: CoveragePoint[];
  locations: LocationItem[];
};
