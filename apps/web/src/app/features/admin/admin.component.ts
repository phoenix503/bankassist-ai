
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import {
  BankingApiService,
  AdminCustomer,
  CreateAdminCustomerRequest,
  CreateAdminCustomerResponse
} from '../../core/services/banking-api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {

  private fb = inject(FormBuilder);
  private bankingApi = inject(BankingApiService);

  customers: AdminCustomer[] = [];

  loading = false;
  creating = false;

  errorMessage = '';
  createErrorMessage = '';
  searchTerm = '';

  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  createdCustomer: CreateAdminCustomerResponse['data'] | null = null;

  customerForm = this.fb.nonNullable.group({
    name: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(255)
    ]],
    mobile: ['', [
      Validators.required,
      Validators.pattern(/^\+?[1-9]\d{7,14}$/)
    ]],
    accountNumber: ['', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(30)
    ]],
    accountType: ['SAVINGS' as 'SAVINGS' | 'CURRENT', [
      Validators.required
    ]],
    balance: ['0', [
      Validators.required,
      Validators.pattern(/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/)
    ]],
    currency: ['INR', [
      Validators.required,
      Validators.pattern(/^[A-Za-z]{3}$/)
    ]]
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getAdminCustomers(
      this.searchTerm,
      this.page,
      this.pageSize
    )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.customers = response.data ?? [];
          this.total = response.total;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Admin customer listing error:', error);

          this.errorMessage =
            error.error?.message ??
            'Unable to load customers. Please try again.';
        }
      });
  }

  searchCustomers(): void {
    this.page = 1;
    this.loadCustomers();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.page = 1;
    this.loadCustomers();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadCustomers();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadCustomers();
    }
  }

  createCustomer(): void {
    if (this.customerForm.invalid || this.creating) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const request: CreateAdminCustomerRequest = {
      ...this.customerForm.getRawValue(),
      name: this.customerForm.controls.name.value.trim(),
      email: this.customerForm.controls.email.value.trim().toLowerCase(),
      mobile: this.customerForm.controls.mobile.value.trim(),
      accountNumber: this.customerForm.controls.accountNumber.value.trim(),
      balance: String(this.customerForm.controls.balance.value).trim(),
      currency: this.customerForm.controls.currency.value.trim().toUpperCase()
    };

    this.creating = true;
    this.createErrorMessage = '';
    this.createdCustomer = null;

    this.bankingApi.createAdminCustomer(request)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: (response) => {
          this.createdCustomer = response.data;

          this.customerForm.reset({
            name: '',
            email: '',
            mobile: '',
            accountNumber: '',
            accountType: 'SAVINGS',
            balance: '0',
            currency: 'INR'
          });

          this.page = 1;
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Create customer error:', error);

          this.createErrorMessage =
            error.error?.message ??
            'Unable to create customer. Please try again.';
        }
      });
  }

  copyCustomerId(customerId: string): void {
    navigator.clipboard?.writeText(customerId);
  }

  getAccountSummary(customer: AdminCustomer): string {
    return customer.accounts
      .map(account => account.accountNumber)
      .join(', ');
  }
}
