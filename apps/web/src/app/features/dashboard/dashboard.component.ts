
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  BankingApiService,
  BankAccount,
  BankTransaction
} from '../../core/services/banking-api.service';

import { CustomerSessionService } from '../../core/services/customer-session.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private bankingApi = inject(BankingApiService);
  private customerSession = inject(CustomerSessionService);
  private router = inject(Router);

  customerId = '';
  today = new Date();
  customerName = '';

  accounts: BankAccount[] = [];
  transactions: BankTransaction[] = [];

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

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    if (!this.customerId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.bankingApi
      .getCustomerTransactions(this.customerId)
      .subscribe({
        next: (response) => {
          this.accounts = response.accounts ?? [];
          this.transactions = (response.data ?? []).slice(0, 5);
          this.loading = false;
        },
        error: (error) => {
          console.error('Dashboard API error:', error);

          this.errorMessage =
            error.error?.message ??
            'Unable to load your banking information. Please try again.';

          this.loading = false;
        }
      });
  }

  get totalBalance(): number {
    return this.accounts.reduce(
      (total, account) => total + Number(account.balance),
      0
    );
  }

  get currency(): string {
    return this.accounts[0]?.currency ?? 'INR';
  }

  logout(): void {
    this.customerSession.logout();
  }

  get customerInitials(): string {
    return this.customerName
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
