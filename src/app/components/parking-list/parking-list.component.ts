import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import * as L from 'leaflet';

import { ParkingService } from '../../services/parking.service';
import { Parking } from '../../models/parking.model';
import { NearbyParking } from '../../models/nearby-parking.model';

const DefaultIcon = L.icon({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'app-parking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-list.component.html'
})
export class ParkingListComponent implements OnInit {

  searchTerm: string = '';

  radius: number | null = null;

  showOnlyFree: boolean = false;

  loading: boolean = true;

  allParkings: Parking[] = [];
  parkings: Parking[] = [];

  nearbyParkings: NearbyParking[] = [];
  isNearbyMode: boolean = false;

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private markerMap = new Map<string, L.Marker>();

  constructor(
    private parkingService: ParkingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAllParkings();
  }

  loadAllParkings(): void {
    this.loading = true;

    this.parkingService.getAll().subscribe({
      next: (data: Parking[]) => {
        this.allParkings = data;
        this.applyFilters();

        this.loading = false;

        setTimeout(() => {
          this.initializeMap();
          this.updateMap();
        });

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyFilters(): void {

    if (this.isNearbyMode) return;

    let base = this.allParkings;

    if (this.showOnlyFree) {
      base = base.filter(p => p.isFree);
    }

    const term = this.searchTerm.toLowerCase().trim();

    if (term) {
      base = base.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term)
      );
    }

    this.parkings = base;
  }

  onSearch(): void {
    this.applyFilters();
    this.updateMap();
    this.cdr.detectChanges();
  }

  toggleFree(): void {
    this.applyFilters();
    this.updateMap();
    this.cdr.detectChanges();
  }

  findNearby(): void {

    if (!this.radius) {
      alert('Please select a radius first.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }

    this.loading = true;

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        this.parkingService.nearby(lat, lon, this.radius!)
          .subscribe({
            next: (data: NearbyParking[]) => {

              this.nearbyParkings = data;
              this.isNearbyMode = true;

              this.loading = false;
              this.updateMap();
              this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {

              console.error(err);
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
      },
      (error: GeolocationPositionError) => {
        console.error(error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    );
  }

  showAll(): void {

    this.searchTerm = '';
    this.radius = null;
    this.showOnlyFree = false;

    this.isNearbyMode = false;

    this.applyFilters();
    this.updateMap();

    this.cdr.detectChanges();
  }

  focusParking(p: Parking): void {
    const key = `${p.latitude}-${p.longitude}`;
    const marker = this.markerMap.get(key);

    if (!marker) return;

    this.map.setView(marker.getLatLng(), 17);
    marker.openPopup();
  }

  focusNearbyParking(item: NearbyParking): void {
    const key = `${item.parking.latitude}-${item.parking.longitude}`;
    const marker = this.markerMap.get(key);

    if (!marker) return;

    this.map.setView(marker.getLatLng(), 17);
    marker.openPopup();
  }

  private initializeMap(): void {
    if (this.map) {
      return;
    }

    this.map = L.map('map').setView(
      [40.6401, 22.9444],
      13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap contributors'
      }
    ).addTo(this.map);
  }

  private updateMap(): void {

    if (!this.map) {
      return;
    }

    // Remove old markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Coordinates for fitBounds()
    const bounds: L.LatLngTuple[] = [];

    if (this.isNearbyMode) {

      this.nearbyParkings.forEach(item => {

        const marker = L.marker([
          item.parking.latitude,
          item.parking.longitude
        ])
          .addTo(this.map)
          .bindPopup(`
        <strong>${item.parking.name}</strong><br>
        ${Math.round(item.distanceMeters)} m away
      `);

        this.markers.push(marker);
        const key = `${item.parking.latitude}-${item.parking.longitude}`;
        this.markerMap.set(key, marker);

        bounds.push([
          item.parking.latitude,
          item.parking.longitude
        ]);
      });

    } else {

      this.parkings.forEach(p => {

        const marker = L.marker([
          p.latitude,
          p.longitude
        ])
          .addTo(this.map)
          .bindPopup(`
        <strong>${p.name}</strong><br>
        ${p.address}
      `);

        this.markers.push(marker);
        const key = `${p.latitude}-${p.longitude}`;
        this.markerMap.set(key, marker);

        bounds.push([
          p.latitude,
          p.longitude
        ]);
      });
    }

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, {
        padding: [40, 40]
      });
    }
  }
}