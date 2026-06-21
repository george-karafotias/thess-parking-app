export interface Parking {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  parkingType: string;
  isFree: boolean;
  phone: string | null;
  website: string | null;
  notes: string | null;
}