
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  BankingApiService,
  SupportDispute,
  SupportDisputeStatus
} from '../../../core/services/banking-api.service';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './support-dashboard.component.html',
  styleUrl: './support-dashboard.component.scss'
})
export class SupportDashboardComponent implements OnInit {

  private bankingApi = inject(BankingApiService);

  disputes: SupportDispute[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: SupportDisputeStatus | '' = '';

  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  summary = {
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0
  };

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getSupportDisputes(
      this.page,
      this.pageSize,
      this.selectedStatus || undefined,
      this.searchTerm
    ).subscribe({
      next: response => {
        this.disputes = response.data;
        this.total = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        this.loading = false;

        this.loadSummary();
      },
      error: error => {
        console.error('Support queue error:', error);
        this.errorMessage = 'Unable to load disputes. Please try again.';
        this.loading = false;
      }
    });
  }

  loadSummary(): void {
    this.bankingApi.getSupportDisputes(1, 100).subscribe({
      next: response => {
        const all = response.data;

        this.summary = {
          total: response.pagination.total,
          open: all.filter(d => d.status === 'OPEN').length,
          underReview: all.filter(d => d.status === 'UNDER_REVIEW').length,
          resolved: all.filter(d => d.status === 'RESOLVED').length,
          rejected: all.filter(d => d.status === 'REJECTED').length
        };
      },
      error: error => {
        console.error('Support summary error:', error);
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadDisputes();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.page = 1;
    this.loadDisputes();
  }

  changePage(direction: number): void {
    const nextPage = this.page + direction;

    if (nextPage < 1 || nextPage > this.totalPages) {
      return;
    }

    this.page = nextPage;
    this.loadDisputes();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  trackByDispute(_: number, dispute: SupportDispute): string {
    return dispute.id;
  }
}
