import { Parking } from './parking.model';

export interface NearbyParking {
  parking: Parking;
  distanceMeters: number;
}