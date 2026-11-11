
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BankAccount {
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: string;
}

export type SupportDisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'REJECTED';

export interface SupportDispute {
  id: string;
  disputeReference: string;
  reason: DisputeReason;
  description: string;
  status: SupportDisputeStatus;
  createdAt: string;
  updatedAt: string;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  transaction: {
    reference: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    description: string;
    createdAt: string;
    accountNumber: string;
    currency: string;
  };

  auditLogCount: number;
}

export interface SupportDisputesResponse {
  success: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: SupportDisputeStatus | null;
    search: string | null;
  };
  data: SupportDispute[];
}

export interface SupportAuditLog {
  id: string;
  previousStatus: SupportDisputeStatus | null;
  newStatus: SupportDisputeStatus;
  actorId: string;
  actorRole: 'CUSTOMER' | 'SUPPORT_AGENT' | 'SYSTEM';
  note: string | null;
  createdAt: string;
}

export interface SupportDisputeDetails {
  id: string;
  disputeReference: string;
  reason: DisputeReason;
  description: string;
  status: SupportDisputeStatus;
  createdAt: string;
  updatedAt: string;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  transactions: {
    reference: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    description: string;
    createdAt: string;
    beneficiaryName: string | null;
    beneficiaryRef: string | null;
    account: {
      accountNumber: string;
      accountType: string;
      currency: string;
    };
  }[];

  auditHistory: SupportAuditLog[];
}

export interface SupportDisputeDetailsResponse {
  success: boolean;
  data: SupportDisputeDetails;
}

export interface UpdateSupportDisputeRequest {
  status: Exclude<SupportDisputeStatus, 'OPEN'>;
  actorId: string;
  note: string;
}


export interface AddSupportDisputeNoteRequest {
  actorId: string;
  note: string;
}

export interface AddSupportDisputeNoteResponse {
  success: boolean;
  message: string;
  data: {
    disputeReference: string;
    auditLog: SupportAuditLog;
  };
}


export interface UpdateSupportDisputeResponse {
  success: boolean;
  message: string;
  data: {
    disputeReference: string;
    previousStatus: SupportDisputeStatus;
    newStatus: SupportDisputeStatus;
    auditLog: SupportAuditLog;
  };
}

export interface BankTransaction {
  id: string;
  reference: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  description: string;
  beneficiaryName: string | null;
  createdAt: string;
  accountNumber: string;
  currency: string;
}

export interface CustomerTransactionsResponse {
  success: boolean;
  accounts: BankAccount[];
  total: number;
  data: BankTransaction[];
}

export interface SupportInvestigationReport {
  category: InvestigationCategory;
  confidence: number;
  investigationStatus: InvestigationStatus;

  evidence: InvestigationEvidence[];
  policyReferences: string[];
  findings: string[];

  requiresCustomerConfirmation: boolean;

  evidenceRating: {
    evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT';
    explanation: string;
  };

  missingInformation: string[];

  suggestedResolution:
  | 'VERIFY_SETTLEMENT'
  | 'CHECK_REVERSAL_AND_TAT'
  | 'WAIT_FOR_FINAL_STATUS'
  | 'VERIFY_BENEFICIARY_CREDIT'
  | 'CUSTOMER_CONFIRMATION_AND_SECURITY_REVIEW'
  | 'REQUEST_ADDITIONAL_INFORMATION'
  | 'PROVIDE_POLICY_GUIDANCE';

  recommendationRationale: string;
}

export interface SupportInvestigationResponse {
  success: boolean;
  message: string;
  data: {
    disputeId: string;
    disputeReference: string;
    reportId: string;
    createdAt: string;
    investigation: SupportInvestigationReport;
    policyAnswer: InvestigationCustomerResponse | null;
  };
}

export interface SavedSupportInvestigationResponse {
  success: boolean;
  message: string;
  data: {
    disputeId: string;
    disputeReference: string;
    status: SupportDisputeStatus;
    investigation: {
      reportId: string;
      createdAt: string;
      report: SupportInvestigationReport;
      policyAnswer: InvestigationCustomerResponse | null;
    } | null;
  };
}

export interface InvestigationEvidence {
  transactionReference: string;
  amount: string;
  currency: string;
  transactionStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  evidenceType: 'TRANSACTION' | 'POTENTIAL_DUPLICATE';
}

export type InvestigationCategory =
  | 'FAILED_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'UNRECOGNIZED_TRANSACTION'
  | 'GENERAL_BANKING';

export type InvestigationStatus =
  | 'POTENTIAL_DUPLICATE'
  | 'FAILED'
  | 'PENDING'
  | 'SUCCESS'
  | 'CUSTOMER_REVIEW_REQUIRED'
  | 'TRANSACTION_NOT_FOUND'
  | 'POLICY_ONLY'
  | 'NEEDS_MORE_INFORMATION';

export interface StructuredInvestigationResult {
  category: InvestigationCategory;
  confidence: number;
  investigationStatus: InvestigationStatus;
  evidence: InvestigationEvidence[];
  policyReferences: string[];
  findings: string[];
  requiresCustomerConfirmation: boolean;
}

export interface InvestigationPolicyCitation {
  documentId: string;
  title: string;
  source: string;
  chunkId: string;
  similarity: number;
}

export interface InvestigationCustomerResponse {
  answer: string;
  citations: InvestigationPolicyCitation[];
  grounded: boolean;
  reason?: string;
  threshold: number;
}



export interface InvestigationResponse {
  success: boolean;

  data: {
    customerId: string;
    message: string;
    transactionReference?: string;

    // New structured investigation result
    investigation: StructuredInvestigationResult;

    // Customer-facing answer
    response: InvestigationCustomerResponse | null;

    // Existing classification
    classification?: {
      category: string;
      intent: string;
      confidence: number;
      requiresInvestigation: boolean;
      explanation: string;
    };

    transactions?: BankTransaction[];

    duplicateCandidates?: Array<{
      firstTransaction: string;
      secondTransaction: string;
      amount: string;
      currency: string;
      description: string;
      beneficiaryName: string | null;
      timeDifferenceMs: number;
      status: string;
    }>;

    failedTransactionAnalysis?: unknown;
    unrecognizedTransactionAnalysis?: unknown;

    policyResults?: Array<{
      documentId: string;
      title: string;
      source: string;
      chunkId: string;
      similarity: number;
    }>;

    // Preserved for backward compatibility
    policyAnswer?: InvestigationCustomerResponse;

    structuredResult?: StructuredInvestigationResult;
  };
}


export interface CustomerDispute {
  id: string;
  disputeReference: string;
  reason: DisputeReason;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;

  transactionReferences: string[];

  transactions: {
    reference: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    description: string;
    createdAt: string;
    accountNumber: string;
    currency: string;
  }[];
}

export interface CustomerProfileAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  currency: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  createdAt: string;
  accounts: CustomerProfileAccount[];
}

export interface CustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  createdAt: string;
  accounts: CustomerProfileAccount[];
}

export interface AdminCustomersResponse {
  success: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: AdminCustomer[];
}

export interface CreateAdminCustomerRequest {
  name: string;
  email: string;
  mobile: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: string;
  currency: string;
}

export interface CreateAdminCustomerResponse {
  success: boolean;
  message: string;
  data: {
    customer: {
      id: string;
      name: string;
      email: string;
      mobile: string;
      createdAt: string;
    };
    account: CustomerProfileAccount & {
      createdAt: string;
    };
  };
}

export interface CustomerDisputesResponse {
  success: boolean;

  customer: {
    id: string;
    name: string;
  };

  total: number;
  data: CustomerDispute[];
}

export type DisputeReason =
  | 'FAILED_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'UNRECOGNIZED_TRANSACTION'
  | 'OTHER';


export type CreateDisputeRequest = {
  reason: DisputeReason;
  description: string;
  customerConfirmation: true;
} & (
    | {
      transactionReference: string;
      transactionReferences?: never;
    }
    | {
      transactionReferences: string[];
      transactionReference?: never;
    }
  );



export interface DisputeResponse {
  success: boolean;
  message: string;
  data?: {
    disputeReference: string;
    transactionReference: string | null;
    transactionReferences: string[];
    transactions: {
      reference: string;
      amount: string;
      type: 'DEBIT' | 'CREDIT';
      status: 'SUCCESS' | 'PENDING' | 'FAILED';
      description: string;
      createdAt: string;
      accountNumber: string;
      currency: string;
    }[];
    reason: DisputeReason;
    status: string;
    createdAt: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class BankingApiService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api';

  getCustomerTransactions(
    customerId: string
  ): Observable<CustomerTransactionsResponse> {
    return this.http.get<CustomerTransactionsResponse>(
      `${this.apiUrl}/customers/${customerId}/transactions`
    );
  }

  investigateCustomer(
    customerId: string,
    message: string,
    transactionReference?: string
  ): Observable<InvestigationResponse> {
    return this.http.post<InvestigationResponse>(
      `${this.apiUrl}/customers/${customerId}/investigations`,
      {
        message,
        ...(transactionReference
          ? { transactionReference }
          : {})
      }
    );
  }

  createDispute(
    customerId: string,
    request: CreateDisputeRequest
  ): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      `${this.apiUrl}/customers/${customerId}/disputes`,
      request
    );
  }

  getCustomerDisputes(
    customerId: string
  ): Observable<CustomerDisputesResponse> {
    return this.http.get<CustomerDisputesResponse>(
      `${this.apiUrl}/customers/${customerId}/disputes`
    );
  }

  getSupportDisputes(
    page = 1,
    pageSize = 10,
    status?: SupportDisputeStatus,
    search?: string
  ): Observable<SupportDisputesResponse> {
    let params: Record<string, string | number> = {
      page,
      pageSize
    };

    if (status) {
      params['status'] = status;
    }

    if (search?.trim()) {
      params['search'] = search.trim();
    }

    return this.http.get<SupportDisputesResponse>(
      `${this.apiUrl}/support/disputes`,
      { params }
    );
  }

  getSupportDisputeDetails(
    disputeId: string
  ): Observable<SupportDisputeDetailsResponse> {
    return this.http.get<SupportDisputeDetailsResponse>(
      `${this.apiUrl}/support/disputes/${disputeId}`
    );
  }

  updateSupportDisputeStatus(
    disputeId: string,
    request: UpdateSupportDisputeRequest
  ): Observable<UpdateSupportDisputeResponse> {
    return this.http.patch<UpdateSupportDisputeResponse>(
      `${this.apiUrl}/support/disputes/${disputeId}/status`,
      request
    );
  }

  getCustomerProfile(customerId: string) {
    return this.http.get<CustomerProfileResponse>(
      `${this.apiUrl}/customers/${customerId}`
    );
  }

  getAdminCustomers(
    search = '',
    page = 1,
    pageSize = 10
  ): Observable<AdminCustomersResponse> {
    let params: Record<string, string | number> = {
      page,
      pageSize
    };

    if (search.trim()) {
      params['search'] = search.trim();
    }

    return this.http.get<AdminCustomersResponse>(
      `${this.apiUrl}/admin/customers`,
      { params }
    );
  }

  createAdminCustomer(
    request: CreateAdminCustomerRequest
  ): Observable<CreateAdminCustomerResponse> {
    return this.http.post<CreateAdminCustomerResponse>(
      `${this.apiUrl}/admin/customers`,
      request
    );
  }


  addSupportDisputeNote(
    disputeId: string,
    request: AddSupportDisputeNoteRequest
  ): Observable<AddSupportDisputeNoteResponse> {
    return this.http.post<AddSupportDisputeNoteResponse>(
      `${this.apiUrl}/support/disputes/${disputeId}/notes`,
      request
    );
  }

  runSupportDisputeInvestigation(
    disputeId: string
  ): Observable<SupportInvestigationResponse> {
    return this.http.post<SupportInvestigationResponse>(
      `${this.apiUrl}/support/disputes/${disputeId}/investigate`,
      {}
    );
  }

  getSupportDisputeInvestigation(
    disputeId: string
  ): Observable<SavedSupportInvestigationResponse> {
    return this.http.get<SavedSupportInvestigationResponse>(
      `${this.apiUrl}/support/disputes/${disputeId}/investigate`
    );
  }

}
