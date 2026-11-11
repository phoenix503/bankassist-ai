import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { CustomerSessionService } from '../../core/services/customer-session.service';
import { BankingApiService } from '../../core/services/banking-api.service';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSpinner
  ],
  templateUrl: './customer-portal.component.html',
  styleUrl: './customer-portal.component.scss'
})
export class CustomerPortalComponent {
  loading = false;
  errorMessage = '';

  customerForm = this.fb.nonNullable.group({
    customerId: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private bankingApi: BankingApiService,
    private customerSession: CustomerSessionService,
    private router: Router
  ) { }

  continueToDashboard(): void {
    if (this.customerForm.invalid || this.loading) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const customerId = this.customerForm.controls.customerId.value.trim();

    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getCustomerProfile(customerId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage = 'Unable to find customer details.';
            return;
          }

          // Store the selected customer profile.
          this.customerSession.setCustomer(response.data);

          // Navigate to the customer dashboard.
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Customer not found. Please check your Customer ID.';
        }
      });
  }
}