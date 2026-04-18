export type RoomGuestDetails = {
  guest_id: number;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  is_active: boolean;
  /** Optional — sent/returned when backend supports extended guest profile */
  government_id?: string | null;
  phone?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  special_requests?: string | null;
};

/** Payload for PATCH/POST `/api/v1/admin/rooms/:roomId/guest` */
export type UpsertRoomGuestPayload = {
  guest_name: string;
  government_id?: string | null;
  phone?: string | null;
  check_in: string;
  check_out: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  special_requests?: string | null;
};

export type AdminRoom = {
  id: number;
  hotelId: number;
  roomNumber: string;
  qrToken?: string | null;
  qrImageUrl?: string | null;
  status: string;
  createdAt: string;
  roomType: string;
  description: string | null;
  maxOccupancy: number;
  bedType: string;
  pricePerNight: number;
  amenities: unknown[];
  images: unknown[];
  isActive: boolean;
  updatedAt: string;
  guestDetails: RoomGuestDetails | null;
};

export type AdminRoomsResponse = {
  rooms: AdminRoom[];
};
