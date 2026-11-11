
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BankingApiService, CustomerDispute } from '../../core/services/banking-api.service';
import { CustomerSessionService } from '../../core/services/customer-session.service';

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './disputes.component.html',
  styleUrl: './disputes.component.scss'
})
export class DisputesComponent implements OnInit {

  private bankingApi = inject(BankingApiService);
  private customerSession = inject(CustomerSessionService);
  private router = inject(Router);

  customerId = '';
  customerName = '';

  disputes: CustomerDispute[] = [];

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    const customer = this.customerSession.currentCustomer;

    if (!customer) {
      this.router.navigate(['/customer']);
      return;
    }

    this.customerId = customer.id;
    this.customerName = customer.name;

    this.loadDisputes();
  }

  loadDisputes(): void {
    if (!this.customerId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getCustomerDisputes(this.customerId)
      .subscribe({
        next: (response) => {
          this.disputes = response.data ?? [];
          this.customerName = response.customer.name;
          this.loading = false;
        },
        error: (error) => {
          console.error('Get disputes API error:', error);

          this.errorMessage =
            error.error?.message ??
            'Unable to load your disputes. Please try again.';

          this.loading = false;
        }
      });
  }

  get totalDisputes(): number {
    return this.disputes.length;
  }

  get openDisputes(): number {
    return this.disputes.filter(
      dispute => dispute.status === 'OPEN'
    ).length;
  }

  get underReviewDisputes(): number {
    return this.disputes.filter(
      dispute => dispute.status === 'UNDER_REVIEW'
    ).length;
  }

  get resolvedDisputes(): number {
    return this.disputes.filter(
      dispute => dispute.status === 'RESOLVED'
    ).length;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getReasonLabel(reason: string): string {
    return reason
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
