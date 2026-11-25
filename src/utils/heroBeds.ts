import type { AvailableBedInfo, RoomResponse } from '../types/api';

export interface HeroBedSlot {
  bedId: string;
  bedNumber: string;
  roomNumber: string;
  status: 'AVAILABLE' | 'SELECTED' | 'UNAVAILABLE';
  nightlyRate?: number;
}

export function buildHeroBedSlots(rooms?: RoomResponse[], availableBeds?: AvailableBedInfo[]): HeroBedSlot[] {
  if (!rooms || rooms.length === 0) return [];
  const availMap = new Map<string, AvailableBedInfo>();
  availableBeds?.forEach((b) => availMap.set(b.bedId, b));

  const slots: HeroBedSlot[] = [];
  for (const room of rooms) {
    for (const bed of room.beds) {
      const avail = availMap.get(bed.id);
      slots.push({
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        roomNumber: room.roomNumber,
        status: avail ? 'AVAILABLE' : 'UNAVAILABLE',
        nightlyRate: avail?.nightlyRate ?? room.nightlyRate,
      });
      if (slots.length >= 3) return slots;
    }
  }
  return slots;
}
