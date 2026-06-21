import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ParkingService } from '../../services/parking.service';
import { Parking } from '../../models/parking.model';
import { NearbyParking } from '../../models/nearby-parking.model';

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

  constructor(
    private parkingService: ParkingService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.cdr.detectChanges();
  }

  toggleFree(): void {
    this.applyFilters();
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

    this.cdr.detectChanges();
  }
}