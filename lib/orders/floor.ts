/** Derive a display floor from a room label (e.g. 412 → 4, 101 → 1). */
export function floorFromRoomNumber(roomNumber: string): number | null {
  const digits = roomNumber.match(/\d+/);
  if (!digits) {
    return null;
  }

  const n = parseInt(digits[0], 10);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  if (n < 100) {
    return 1;
  }

  return Math.floor(n / 100);
}
