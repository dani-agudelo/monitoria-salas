import { locations, rooms, shifts, users } from "./monitoring-data";

const wait = (duration = 120) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export const monitoringService = {
  async getPublicRooms() {
    await wait();
    return shifts
      .filter((shift) => shift.status === "active")
      .map((shift) => ({
        shift,
        room: rooms.find((room) => room.id === shift.roomId),
        monitor: users.find((user) => user.id === shift.monitorId),
        location: locations.find(
          (location) =>
            location.id ===
            rooms.find((room) => room.id === shift.roomId)?.locationId,
        ),
      }));
  },
  async getMonitors() {
    await wait();
    return users.filter((user) => user.role === "monitor");
  },
  async getShifts() {
    await wait();
    return shifts;
  },
};
