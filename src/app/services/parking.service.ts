import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parking } from '../models/parking.model';
import { NearbyParking } from '../models/nearby-parking.model';

@Injectable({
  providedIn: 'root'
})
export class ParkingService {

  private baseUrl = 'https://gk-apis.onrender.com/v1/thessparking';

  constructor(private http: HttpClient) {}

  // Get all parkings
  getAll(): Observable<Parking[]> {
    return this.http.get<any>(this.baseUrl);
  }

  // Search parkings by keyword
  search(query: string): Observable<Parking[]> {
    return this.http.get<any>(
      `${this.baseUrl}/search?query=${encodeURIComponent(query)}`
    );
  }

  // Get nearby parkings
  nearby(lat: number, lon: number, radius: number = 1000): Observable<NearbyParking[]> {
    return this.http.get<any>(
      `${this.baseUrl}/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
    );
  }
}