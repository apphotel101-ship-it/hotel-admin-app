import { floorFromRoomNumber } from "@/lib/orders/floor";
import type { AdminRoom } from "./types";

export type RoomGroup = {
  floor: number;
  roomType: string;
  rooms: AdminRoom[];
};

function roomSortKey(roomNumber: string): number {
  const digits = roomNumber.match(/\d+/);
  return digits ? parseInt(digits[0], 10) : 0;
}

function sectionLine(roomType: string): string {
  const t = roomType.trim();
  const lower = t.toLowerCase();
  if (lower.includes("deluxe") || lower.includes("suite") || lower.includes("junior")) {
    return `${t} suites`;
  }
  return `${t} rooms`;
}

export function groupRoomsByFloorAndType(rooms: AdminRoom[]): RoomGroup[] {
  const map = new Map<string, AdminRoom[]>();

  for (const r of rooms) {
    const floor = floorFromRoomNumber(r.roomNumber) ?? 1;
    const key = `${floor}\u001f${r.roomType}`;
    const list = map.get(key);
    if (list) {
      list.push(r);
    } else {
      map.set(key, [r]);
    }
  }

  const groups: RoomGroup[] = [];

  for (const [key, list] of map.entries()) {
    const [floorStr, roomType] = key.split("\u001f");
    const floor = Number(floorStr);
    list.sort((a, b) => roomSortKey(a.roomNumber) - roomSortKey(b.roomNumber));
    groups.push({ floor, roomType, rooms: list });
  }

  groups.sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    return a.roomType.localeCompare(b.roomType);
  });

  return groups;
}

export function sectionTitle(floor: number, roomType: string): string {
  return `Floor ${floor} — ${sectionLine(roomType)}`;
}
