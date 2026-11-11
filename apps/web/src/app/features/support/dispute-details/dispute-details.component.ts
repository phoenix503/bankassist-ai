
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  BankingApiService,
  SupportDisputeDetails,
  SupportDisputeStatus,
  SupportInvestigationReport,
  InvestigationCustomerResponse
} from '../../../core/services/banking-api.service';

@Component({
  selector: 'app-dispute-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './dispute-details.component.html',
  styleUrl: './dispute-details.component.scss'
})
export class DisputeDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private bankingApi = inject(BankingApiService);

  dispute: SupportDisputeDetails | null = null;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  reviewNote = '';
  investigationNote = '';
  savingNote = false;

  // AI investigation state
  investigationLoading = false;
  runningInvestigation = false;
  investigationError = '';

  investigationReport: SupportInvestigationReport | null = null;
  policyAnswer: InvestigationCustomerResponse | null = null;
  investigationCreatedAt: string | null = null;
  investigationReportId: string | null = null;

  // Demo identity only. Replace with authenticated identity later.
  private readonly actorId = 'SUPPORT-001';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const disputeId = params.get('disputeId');

      if (disputeId) {
        this.resetInvestigation();
        this.loadDispute(disputeId);
      }
    });
  }

  loadDispute(disputeId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.bankingApi.getSupportDisputeDetails(disputeId).subscribe({
      next: response => {
        this.dispute = response.data;
        this.loading = false;

        // Load the latest saved AI report independently.
        this.loadInvestigation(disputeId);
      },
      error: error => {
        console.error('Dispute details error:', error);
        this.errorMessage = 'Unable to load dispute details.';
        this.loading = false;
      }
    });
  }

  loadInvestigation(disputeId: string): void {
    this.investigationLoading = true;
    this.investigationError = '';

    this.bankingApi.getSupportDisputeInvestigation(disputeId)
      .subscribe({
        next: response => {
          const saved = response.data.investigation;

          this.investigationReport = saved?.report ?? null;
          this.policyAnswer = saved?.policyAnswer ?? null;
          this.investigationCreatedAt = saved?.createdAt ?? null;
          this.investigationReportId = saved?.reportId ?? null;

          this.investigationLoading = false;
        },
        error: error => {
          console.error('Investigation retrieval error:', error);

          this.investigationError =
            error.error?.message ??
            'Unable to retrieve the saved AI investigation.';

          this.investigationLoading = false;
        }
      });
  }

  runInvestigation(): void {
    if (
      !this.dispute ||
      this.dispute.status !== 'UNDER_REVIEW' ||
      this.runningInvestigation
    ) {
      return;
    }

    this.runningInvestigation = true;
    this.investigationError = '';
    this.successMessage = '';

    this.bankingApi.runSupportDisputeInvestigation(
      this.dispute.id
    ).subscribe({
      next: response => {
        this.investigationReport = response.data.investigation;
        this.policyAnswer = response.data.policyAnswer;
        this.investigationCreatedAt = response.data.createdAt;
        this.investigationReportId = response.data.reportId;

        this.successMessage = response.message;
        this.runningInvestigation = false;
      },
      error: error => {
        console.error('AI investigation error:', error);

        this.investigationError =
          error.error?.message ??
          'Unable to run AI investigation. Please try again.';

        this.runningInvestigation = false;
      }
    });
  }

  private resetInvestigation(): void {
    this.investigationReport = null;
    this.policyAnswer = null;
    this.investigationCreatedAt = null;
    this.investigationReportId = null;
    this.investigationError = '';
    this.investigationLoading = false;
    this.runningInvestigation = false;
  }

  updateStatus(status: SupportDisputeStatus): void {
    if (!this.dispute || this.submitting) {
      return;
    }

    const note = this.reviewNote.trim();

    if (note.length < 5) {
      this.errorMessage =
        'Please enter a review note of at least 5 characters.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.bankingApi.updateSupportDisputeStatus(
      this.dispute.id,
      {
        status: status as Exclude<SupportDisputeStatus, 'OPEN'>,
        actorId: this.actorId,
        note
      }
    ).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.reviewNote = '';
        this.submitting = false;

        this.loadDispute(this.dispute!.id);
      },
      error: error => {
        console.error('Status update error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to update dispute status.';

        this.submitting = false;
      }
    });
  }

  saveInvestigationNote(): void {
    if (
      !this.dispute ||
      this.dispute.status !== 'UNDER_REVIEW' ||
      this.savingNote
    ) {
      return;
    }

    const note = this.investigationNote.trim();

    if (note.length < 5) {
      this.errorMessage =
        'Please enter an investigation note of at least 5 characters.';
      return;
    }

    this.savingNote = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.bankingApi.addSupportDisputeNote(
      this.dispute.id,
      {
        actorId: this.actorId,
        note
      }
    ).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.investigationNote = '';
        this.savingNote = false;

        this.loadDispute(this.dispute!.id);
      },
      error: error => {
        console.error('Investigation note error:', error);

        this.errorMessage =
          error.error?.message ||
          'Unable to save investigation note.';

        this.savingNote = false;
      }
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  get canStartReview(): boolean {
    return this.dispute?.status === 'OPEN';
  }

  get canCompleteReview(): boolean {
    return this.dispute?.status === 'UNDER_REVIEW';
  }

  get canRunInvestigation(): boolean {
    return this.dispute?.status === 'UNDER_REVIEW';
  }

  get hasInvestigation(): boolean {
    return this.investigationReport !== null;
  }

  getSuggestedResolutionLabel(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
