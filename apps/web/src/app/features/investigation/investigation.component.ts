
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterLink } from '@angular/router';
import { CustomerSessionService } from '../../core/services/customer-session.service';
import {
  BankingApiService,
  InvestigationResponse,
  DisputeReason,
  DisputeResponse
} from '../../core/services/banking-api.service';

@Component({
  selector: 'app-investigation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.scss'
})

export class InvestigationComponent implements OnInit {

  private fb = inject(FormBuilder);
  private bankingApi = inject(BankingApiService);
  private customerSession = inject(CustomerSessionService);
  private router = inject(Router);

  customerId = '';
  customerName = '';

  loading = false;
  submittingDispute = false;

  errorMessage = '';
  disputeErrorMessage = '';

  investigationResult: InvestigationResponse['data'] | null = null;
  disputeResult: DisputeResponse['data'] | null = null;

  // Transactions explicitly selected by the customer
  selectedTransactionReferences: string[] = [];

  form = this.fb.group({
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(2000)
      ]
    ],
    transactionReference: ['']
  });

  disputeForm = this.fb.group({
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]
    ],
    customerConfirmation: [false, Validators.requiredTrue]
  });

  sampleComplaints = [
    {
      label: 'Duplicate debit',
      message: 'I was charged twice for the same restaurant transaction',
      reference: 'TXN1003'
    },
    {
      label: 'Failed transaction',
      message: 'Money was debited but the beneficiary has not received it',
      reference: 'TXN1006'
    },
    {
      label: 'Unrecognized transaction',
      message: 'I do not recognize this transaction on my account',
      reference: 'TXN1001'
    }
  ];

  ngOnInit(): void {
    const customer = this.customerSession.currentCustomer;

    if (!customer) {
      this.router.navigate(['/customer']);
      return;
    }

    this.customerId = customer.id;
    this.customerName = customer.name;
  }

  get disputeReason(): DisputeReason | null {
    const category = this.investigationResult?.classification?.category;

    switch (category) {
      case 'FAILED_TRANSACTION':
        return 'FAILED_TRANSACTION';

      case 'DUPLICATE_TRANSACTION':
        return 'DUPLICATE_TRANSACTION';

      case 'UNRECOGNIZED_TRANSACTION':
        return 'UNRECOGNIZED_TRANSACTION';

      default:
        return null;
    }
  }

  get isUnrecognizedDispute(): boolean {
    return this.disputeReason === 'UNRECOGNIZED_TRANSACTION';
  }

  get isDuplicateDispute(): boolean {
    return this.disputeReason === 'DUPLICATE_TRANSACTION';
  }

  get duplicateCandidates() {
    return this.investigationResult?.duplicateCandidates ?? [];
  }

  get disputeTransactionReferences(): string[] {
    if (this.isDuplicateDispute || this.isUnrecognizedDispute) {
      return this.selectedTransactionReferences;
    }

    const reference =
      this.form.controls.transactionReference.value?.trim();

    return reference ? [reference] : [];
  }

  get canSubmitDispute(): boolean {
    const investigation = this.structuredInvestigation;
    const transactionReferences = this.disputeTransactionReferences;

    const validTransactionSelection = this.isDuplicateDispute
      ? transactionReferences.length >= 2
      : transactionReferences.length === 1;

    return !!(
      this.investigationResult &&
      investigation &&
      investigation.category !== 'GENERAL_BANKING' &&
      investigation.investigationStatus !== 'TRANSACTION_NOT_FOUND' &&
      this.investigationResult.classification?.requiresInvestigation &&
      this.disputeReason &&
      validTransactionSelection &&
      this.disputeForm.valid &&
      !this.submittingDispute &&
      !this.disputeResult
    );
  }

  get structuredInvestigation() {
    return this.investigationResult?.investigation ?? null;
  }

  get customerResponse() {
    return this.investigationResult?.response ?? null;
  }

  get investigationEvidence() {
    return this.structuredInvestigation?.evidence ?? [];
  }

  get investigationFindings() {
    return this.structuredInvestigation?.findings ?? [];
  }

  /**
   * Select or deselect a transaction candidate.
   */
  toggleTransactionSelection(
    reference: string,
    checked: boolean
  ): void {
    if (
      this.isUnrecognizedDispute &&
      !this.investigationEvidence.some(
        evidence => evidence.transactionReference === reference
      )
    ) {
      return;
    }

    if (checked) {
      if (!this.selectedTransactionReferences.includes(reference)) {
        this.selectedTransactionReferences = [
          ...this.selectedTransactionReferences,
          reference
        ];
      }
    } else {
      this.selectedTransactionReferences =
        this.selectedTransactionReferences.filter(
          item => item !== reference
        );
    }
  }

  /**
   * Check whether a transaction is selected.
   */
  isTransactionSelected(reference: string): boolean {
    return this.selectedTransactionReferences.includes(reference);
  }

  selectSample(sample: {
    message: string;
    reference: string;
  }): void {
    this.form.patchValue({
      message: sample.message,
      transactionReference: sample.reference
    });

    this.investigationResult = null;
    this.selectedTransactionReferences = [];
    this.errorMessage = '';

    this.resetDispute();
  }

  submitInvestigation(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const message = this.form.controls.message.value!.trim();

    const reference =
      this.form.controls.transactionReference.value?.trim();

    this.loading = true;
    this.errorMessage = '';

    this.investigationResult = null;
    this.selectedTransactionReferences = [];

    this.resetDispute();

    this.bankingApi
      .investigateCustomer(
        this.customerId,
        message,
        reference || undefined
      )
      .subscribe({
        next: (response) => {
          this.investigationResult = response.data;

          if (this.disputeReason) {
            this.disputeForm.patchValue({
              description: message
            });
          }

          this.loading = false;
        },

        error: (error) => {
          console.error('Investigation API error:', error);

          this.errorMessage =
            error.error?.message ??
            'Unable to complete the investigation. Please try again.';

          this.loading = false;
        }
      });
  }

  submitDispute(): void {
    if (!this.canSubmitDispute || !this.disputeReason) {
      this.disputeForm.markAllAsTouched();
      return;
    }

    const description =
      this.disputeForm.controls.description.value?.trim();

    const transactionReferences =
      this.disputeTransactionReferences;

    if (!description || transactionReferences.length === 0) {
      return;
    }

    this.submittingDispute = true;
    this.disputeErrorMessage = '';

    const request = this.isDuplicateDispute
      ? {
        transactionReferences,
        reason: this.disputeReason,
        description,
        customerConfirmation: true as const
      }
      : {
        transactionReference: transactionReferences[0],
        reason: this.disputeReason,
        description,
        customerConfirmation: true as const
      };

    this.bankingApi.createDispute(
      this.customerId,
      request
    ).subscribe({
      next: (response) => {
        this.disputeResult = response.data ?? null;
        this.submittingDispute = false;
      },

      error: (error) => {
        console.error('Dispute submission error:', error);

        this.disputeErrorMessage =
          error.error?.message ??
          'Unable to submit your dispute. Please try again.';

        this.submittingDispute = false;
      }
    });
  }

  resetDispute(): void {
    this.disputeForm.reset({
      description: '',
      customerConfirmation: false
    });

    this.disputeResult = null;
    this.disputeErrorMessage = '';
    this.selectedTransactionReferences = [];
  }

  resetInvestigation(): void {
    this.form.reset({
      message: '',
      transactionReference: ''
    });

    this.investigationResult = null;
    this.errorMessage = '';

    this.selectedTransactionReferences = [];

    this.resetDispute();
  }

  logout(): void {
    this.customerSession.logout();
  }
}

