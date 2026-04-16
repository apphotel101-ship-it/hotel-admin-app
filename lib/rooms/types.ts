export type AdminRoom = {
  id: number;
  hotelId: number;
  roomNumber: string;
  qrToken?: string;
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
};

export type AdminRoomsResponse = {
  rooms: AdminRoom[];
};
