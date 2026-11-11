import { z } from "zod";
import { geminiModel } from "@/lib/ai/gemini";
import {
  investigationCategorySchema,
  investigationStatusSchema,
  InvestigationEvidence,
  investigationResultSchema,
} from "@/lib/ai/investigation.schema";

// Gemini generates the explanation and proposed outcome.
// Evidence and policy references are supplied by our backend.
const geminiInvestigationSchema = z.object({
  category: investigationCategorySchema,

  confidence: z.number().min(0).max(1),

  investigationStatus: investigationStatusSchema,

  findings: z.array(z.string()).min(1),

  requiresCustomerConfirmation: z.boolean(),
});

type GenerateInvestigationInput = {
  category: z.infer<typeof investigationCategorySchema>;
  confidence: number;
  investigationStatus: z.infer<typeof investigationStatusSchema>;
  evidence: InvestigationEvidence[];
  policyReferences: string[];
  customerMessage: string;
};

export async function generateStructuredInvestigation(
  input: GenerateInvestigationInput
) {
  const structuredModel = geminiModel.withStructuredOutput(
    geminiInvestigationSchema,
    {
      name: "banking_investigation_result",
    }
  );

  const evidenceRating = calculateEvidenceRating(input);

  const recommendation = getSuggestedResolution(input);

  const generated = await structuredModel.invoke([
    [
      "system",
      `You are BankAssist AI, a banking investigation assistant.

Your task is to explain the supplied investigation results.

STRICT RULES:
1. Do not invent transaction details.
2. Do not invent policy references.
3. Do not change the supplied category.
4. Do not change the supplied confidence.
5. Do not change the supplied investigation status.
6. Do not declare fraud based only on an unrecognized transaction.
7. A SUCCESS transaction does not prove beneficiary settlement.
8. A potential duplicate is not a confirmed duplicate.
9. Respect the supplied customer confirmation requirement.
10. Keep findings concise and evidence-based.

Return structured output only.`,
    ],
    [
      "human",
      JSON.stringify({
        customerMessage: input.customerMessage,
        trustedInvestigationData: {
          category: input.category,
          confidence: input.confidence,
          investigationStatus: input.investigationStatus,
          evidence: input.evidence,
          policyReferences: input.policyReferences,
        },
      }),
    ],
  ]);

  // Never trust Gemini to supply authoritative banking facts.
  const result = {
    category: input.category,
    confidence: input.confidence,
    investigationStatus: input.investigationStatus,
    evidence: input.evidence,
    policyReferences: input.policyReferences,
    findings: generated.findings,
    requiresCustomerConfirmation:
      input.category !== "GENERAL_BANKING",
    evidenceRating,
    missingInformation: recommendation.missingInformation,
    suggestedResolution: recommendation.suggestedResolution,
    recommendationRationale: recommendation.recommendationRationale,
  };

  return investigationResultSchema.parse(result);
}


type EvidenceStrength =
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "INSUFFICIENT";

type SuggestedResolution =
  | "VERIFY_SETTLEMENT"
  | "CHECK_REVERSAL_AND_TAT"
  | "WAIT_FOR_FINAL_STATUS"
  | "VERIFY_BENEFICIARY_CREDIT"
  | "CUSTOMER_CONFIRMATION_AND_SECURITY_REVIEW"
  | "REQUEST_ADDITIONAL_INFORMATION"
  | "PROVIDE_POLICY_GUIDANCE";

function calculateEvidenceRating(
  input: GenerateInvestigationInput
): {
  evidenceStrength: EvidenceStrength;
  explanation: string;
} {
  if (input.evidence.length === 0) {
    return {
      evidenceStrength: "INSUFFICIENT",
      explanation:
        "No verified transaction evidence is available for this investigation.",
    };
  }

  if (input.evidence.length === 1) {
    return {
      evidenceStrength: "WEAK",
      explanation:
        "Only one transaction record is available. Additional supporting evidence is required.",
    };
  }

  if (
    input.category === "DUPLICATE_TRANSACTION" &&
    input.investigationStatus === "POTENTIAL_DUPLICATE"
  ) {
    return {
      evidenceStrength: "MODERATE",
      explanation:
        "Multiple transactions match the deterministic duplicate indicators. Settlement verification is still required.",
    };
  }

  return {
    evidenceStrength: "MODERATE",
    explanation:
      "Multiple transaction records are available, but independent supporting evidence is not yet established.",
  };
}

function getSuggestedResolution(
  input: GenerateInvestigationInput
): {
  suggestedResolution: SuggestedResolution;
  recommendationRationale: string;
  missingInformation: string[];
} {
  switch (input.category) {
    case "DUPLICATE_TRANSACTION":
      return {
        suggestedResolution: "VERIFY_SETTLEMENT",
        recommendationRationale:
          "Potential duplicate transactions require settlement verification before a final dispute decision.",
        missingInformation: [
          "Independent settlement confirmation for both transactions.",
          "Confirmation of whether both debits were actually posted.",
        ],
      };

    case "FAILED_TRANSACTION":
      if (input.investigationStatus === "FAILED") {
        return {
          suggestedResolution: "CHECK_REVERSAL_AND_TAT",
          recommendationRationale:
            "The transaction is marked FAILED. Verify reversal status and applicable resolution timelines.",
          missingInformation: [
            "Reversal or refund confirmation.",
            "Payment rail and transaction initiation timestamp.",
          ],
        };
      }

      if (input.investigationStatus === "PENDING") {
        return {
          suggestedResolution: "WAIT_FOR_FINAL_STATUS",
          recommendationRationale:
            "The transaction remains pending. Final status and settlement information are needed.",
          missingInformation: [
            "Final transaction status.",
            "Settlement or reversal confirmation.",
          ],
        };
      }

      if (input.investigationStatus === "SUCCESS") {
        return {
          suggestedResolution: "VERIFY_BENEFICIARY_CREDIT",
          recommendationRationale:
            "The transaction is marked SUCCESS, but beneficiary credit is not established by the available records.",
          missingInformation: [
            "Beneficiary credit confirmation.",
            "Payment rail settlement information.",
          ],
        };
      }

      break;

    case "UNRECOGNIZED_TRANSACTION":
      return {
        suggestedResolution:
          "CUSTOMER_CONFIRMATION_AND_SECURITY_REVIEW",
        recommendationRationale:
          "The customer must confirm whether they recognize the transaction. An unrecognized transaction alone does not establish fraud.",
        missingInformation: [
          "Customer confirmation.",
          "Additional transaction and merchant verification.",
          "Applicable reporting and liability information.",
        ],
      };

    case "GENERAL_BANKING":
      return {
        suggestedResolution: "PROVIDE_POLICY_GUIDANCE",
        recommendationRationale:
          "Provide an answer using the available relevant banking policy.",
        missingInformation: [],
      };
  }

  return {
    suggestedResolution: "REQUEST_ADDITIONAL_INFORMATION",
    recommendationRationale:
      "The available information is insufficient to recommend a more specific next action.",
    missingInformation: [
      "Additional transaction information.",
      "Supporting evidence relevant to the complaint.",
    ],
  };
}
