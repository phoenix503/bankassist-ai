
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  BankingApiService,
  BankTransaction
} from '../../core/services/banking-api.service';
import { CustomerSessionService } from '../../core/services/customer-session.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  private readonly bankingApi = inject(BankingApiService);
  private readonly customerSession = inject(CustomerSessionService);
  private readonly router = inject(Router);

  customerId = '';
  customerName = '';

  transactions: BankTransaction[] = [];
  accounts: Array<{
    accountNumber: string;
    accountType: string;
    currency: string;
    balance: string;
  }> = [];

  loading = true;
  errorMessage = '';

  searchTerm = '';
  selectedStatus = 'ALL';
  selectedType = 'ALL';
  selectedAccount = 'ALL';

  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    const customer = this.customerSession.currentCustomer;

    if (!customer) {
      void this.router.navigate(['/customer']);
      return;
    }

    this.customerId = customer.id;
    this.customerName = customer.name;

    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getCustomerTransactions(this.customerId).subscribe({
      next: (response) => {
        this.transactions = response.data ?? [];
        this.accounts = response.accounts ?? [];
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
        this.errorMessage =
          'Unable to load transactions. Please try again.';
        this.loading = false;
      }
    });
  }

  get filteredTransactions(): BankTransaction[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.transactions.filter((transaction) => {
      const matchesSearch =
        !search ||
        transaction.reference.toLowerCase().includes(search) ||
        transaction.description.toLowerCase().includes(search) ||
        (transaction.beneficiaryName ?? '').toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        transaction.status === this.selectedStatus;

      const matchesType =
        this.selectedType === 'ALL' ||
        transaction.type === this.selectedType;

      const matchesAccount =
        this.selectedAccount === 'ALL' ||
        transaction.accountNumber === this.selectedAccount;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesAccount
      );
    });
  }

  get paginatedTransactions(): BankTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredTransactions.slice(
      start,
      start + this.pageSize
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredTransactions.length / this.pageSize)
    );
  }

  get totalCredits(): number {
    return this.transactions
      .filter((transaction) => transaction.type === 'CREDIT')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  get totalDebits(): number {
    return this.transactions
      .filter((transaction) => transaction.type === 'DEBIT')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  get successfulTransactions(): number {
    return this.transactions.filter(
      (transaction) => transaction.status === 'SUCCESS'
    ).length;
  }

  get startRecord(): number {
    return this.filteredTransactions.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredTransactions.length
    );
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  onStatusChange(value: string): void {
    this.selectedStatus = value;
    this.currentPage = 1;
  }

  onTypeChange(value: string): void {
    this.selectedType = value;
    this.currentPage = 1;
  }

  onAccountChange(value: string): void {
    this.selectedAccount = value;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedType = 'ALL';
    this.selectedAccount = 'ALL';
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  logout(): void {
    this.customerSession.logout();
  }

  trackByReference(
    _index: number,
    transaction: BankTransaction
  ): string {
    return transaction.reference;
  }
}
