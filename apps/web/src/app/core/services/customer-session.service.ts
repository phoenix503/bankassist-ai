
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

import { CustomerProfile } from './banking-api.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerSessionService {
  private readonly customerSubject =
    new BehaviorSubject<CustomerProfile | null>(null);

  readonly customer$ = this.customerSubject.asObservable();

  constructor(private router: Router) { }

  get currentCustomer(): CustomerProfile | null {
    return this.customerSubject.value;
  }

  setCustomer(customer: CustomerProfile): void {
    this.customerSubject.next(customer);
  }

  clearCustomer(): void {
    this.customerSubject.next(null);
  }

  logout(): void {
    this.clearCustomer();
    void this.router.navigate(['/']);
  }
}
