export type UserRole = "coordinator" | "monitor";
export type ShiftStatus = "scheduled" | "active" | "completed";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

export interface Location {
  id: string;
  name: "Sede Central" | "Sede Lans";
}

export interface Room {
  id: string;
  locationId: string;
  name: string;
  capacity: number;
  features: string[];
}

export interface Shift {
  id: string;
  roomId: string;
  monitorId: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  observations?: string;
}

export const locations: Location[] = [
  { id: "central", name: "Sede Central" },
  { id: "lans", name: "Sede Lans" },
];

export const rooms: Room[] = [
  {
    id: "c201",
    locationId: "central",
    name: "Sala C-201",
    capacity: 32,
    features: ["32 equipos", "Aire acondicionado"],
  },
  {
    id: "c305",
    locationId: "central",
    name: "Sala C-305",
    capacity: 24,
    features: ["24 equipos", "Software de diseño"],
  },
  {
    id: "l102",
    locationId: "lans",
    name: "Sala L-102",
    capacity: 28,
    features: ["28 equipos", "Zona silenciosa"],
  },
  {
    id: "l204",
    locationId: "lans",
    name: "Sala L-204",
    capacity: 20,
    features: ["20 equipos", "Acceso universal"],
  },
];

export const users: User[] = [
  {
    id: "m1",
    role: "monitor",
    name: "Laura Méndez",
    email: "laura.mendez@universidad.edu.co",
  },
  {
    id: "m2",
    role: "monitor",
    name: "Santiago Ruiz",
    email: "santiago.ruiz@universidad.edu.co",
  },
  {
    id: "m3",
    role: "monitor",
    name: "Valentina Ríos",
    email: "valentina.rios@universidad.edu.co",
  },
  {
    id: "m4",
    role: "monitor",
    name: "Nicolás Gómez",
    email: "nicolas.gomez@universidad.edu.co",
  },
  {
    id: "c1",
    role: "coordinator",
    name: "Daniela Agudelo",
    email: "daniela.agudelo@universidad.edu.co",
  },
];

export const shifts: Shift[] = [
  {
    id: "s1",
    roomId: "c201",
    monitorId: "m1",
    startTime: "2026-10-01T08:00:00-05:00",
    endTime: "2026-10-01T12:00:00-05:00",
    status: "active",
  },
  {
    id: "s2",
    roomId: "c305",
    monitorId: "m2",
    startTime: "2026-10-01T10:00:00-05:00",
    endTime: "2026-10-01T14:00:00-05:00",
    status: "active",
    observations: "Dos equipos en mantenimiento.",
  },
  {
    id: "s3",
    roomId: "l102",
    monitorId: "m3",
    startTime: "2026-10-01T09:00:00-05:00",
    endTime: "2026-10-01T13:00:00-05:00",
    status: "active",
  },
  {
    id: "s4",
    roomId: "l204",
    monitorId: "m4",
    startTime: "2026-10-01T14:00:00-05:00",
    endTime: "2026-10-01T18:00:00-05:00",
    status: "scheduled",
  },
  {
    id: "s5",
    roomId: "c201",
    monitorId: "m1",
    startTime: "2026-10-03T14:00:00-05:00",
    endTime: "2026-10-03T18:00:00-05:00",
    status: "scheduled",
  },
];

export const coverageByDay = [
  { day: "Lun", Central: 8, Lans: 4 },
  { day: "Mar", Central: 12, Lans: 8 },
  { day: "Mié", Central: 8, Lans: 8 },
  { day: "Jue", Central: 8, Lans: 4 },
  { day: "Vie", Central: 4, Lans: 8 },
];
