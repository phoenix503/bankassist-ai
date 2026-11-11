import { z } from "zod";

export const investigationCategorySchema = z.enum([
  "FAILED_TRANSACTION",
  "DUPLICATE_TRANSACTION",
  "UNRECOGNIZED_TRANSACTION",
  "GENERAL_BANKING",
]);

export const investigationStatusSchema = z.enum([
  "POTENTIAL_DUPLICATE",
  "FAILED",
  "PENDING",
  "SUCCESS",
  "CUSTOMER_REVIEW_REQUIRED",
  "TRANSACTION_NOT_FOUND",
  "POLICY_ONLY",
  "NEEDS_MORE_INFORMATION",
]);

export const investigationEvidenceSchema = z.object({
  transactionReference: z.string(),
  amount: z.string(),
  currency: z.string(),
  transactionStatus: z.enum([
    "SUCCESS",
    "PENDING",
    "FAILED",
  ]),
  evidenceType: z.enum([
    "TRANSACTION",
    "POTENTIAL_DUPLICATE",
  ]),
});


export const evidenceStrengthSchema = z.enum([
  "STRONG",
  "MODERATE",
  "WEAK",
  "INSUFFICIENT",
]);

export const suggestedResolutionSchema = z.enum([
  "VERIFY_SETTLEMENT",
  "CHECK_REVERSAL_AND_TAT",
  "WAIT_FOR_FINAL_STATUS",
  "VERIFY_BENEFICIARY_CREDIT",
  "CUSTOMER_CONFIRMATION_AND_SECURITY_REVIEW",
  "REQUEST_ADDITIONAL_INFORMATION",
  "PROVIDE_POLICY_GUIDANCE",
]);

export const investigationRatingSchema = z.object({
  evidenceStrength: evidenceStrengthSchema,
  explanation: z.string(),
});


export const investigationResultSchema = z.object({
  category: investigationCategorySchema,

  confidence: z.number().min(0).max(1),

  investigationStatus: investigationStatusSchema,

  evidence: z.array(investigationEvidenceSchema),

  policyReferences: z.array(z.string()),

  findings: z.array(z.string()),

  requiresCustomerConfirmation: z.boolean(),


  evidenceRating: investigationRatingSchema,

  missingInformation: z.array(z.string()),

  suggestedResolution: suggestedResolutionSchema,

  recommendationRationale: z.string(),

});

export type InvestigationResult = z.infer<
  typeof investigationResultSchema
>;

export type InvestigationEvidence = z.infer<
  typeof investigationEvidenceSchema
>;