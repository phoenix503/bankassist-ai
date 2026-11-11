import {
  Annotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { classifyBankingQuery } from "@/lib/ai/classifier";
import { prisma } from "@/lib/db/prisma";
import { searchPolicies } from "@/lib/rag/search-policy";
import { generatePolicyAnswer } from "@/lib/rag/answer-policy";
import type { PolicySearchResult } from "@/lib/rag/answer-policy";
import {
  InvestigationResult,
  InvestigationEvidence,
} from "@/lib/ai/investigation.schema";

import {
  generateStructuredInvestigation,
} from "@/lib/ai/investigation-output";

// 1. Define the investigation state
const InvestigationState = Annotation.Root({
  customerId: Annotation<string>(),
  message: Annotation<string>(),
  transactionReference: Annotation<string | undefined>(),
  transactionReferences: Annotation<string[] | undefined>(),

  classification: Annotation<Record<string, unknown> | undefined>(),

  transactions: Annotation<Record<string, unknown>[]>({
    value: (current, update) => update,
    default: () => [],
  }),

  duplicateCandidates: Annotation<Record<string, unknown>[]>({
    value: (current, update) => update,
    default: () => [],
  }),

  failedTransactionAnalysis: Annotation<
    Record<string, unknown> | undefined
  >(),

  unrecognizedTransactionAnalysis: Annotation<
    Record<string, unknown> | undefined
  >(),
  policyResults: Annotation<PolicySearchResult[]>({
    value: (current, update) => update,
    default: () => [],
  }),

  policyAnswer: Annotation<
    Record<string, unknown> | undefined
  >(),
  structuredResult: Annotation<InvestigationResult | undefined>(),
});

// 2. Define the first node
async function classifyComplaint(
  state: typeof InvestigationState.State
) {
  const classification = await classifyBankingQuery(state.message);

  console.log("Gemini classification:", classification);

  return {
    classification,
  };
}


async function retrieveTransactions(
  state: typeof InvestigationState.State
) {
  console.log("Retrieving transactions for:", state.customerId);



  // Support investigation: retrieve only transactions
  // explicitly linked to the submitted dispute.
  if (state.transactionReferences?.length) {
    const linkedTransactions = await prisma.transaction.findMany({
      where: {
        reference: {
          in: state.transactionReferences,
        },
        account: {
          customerId: state.customerId,
        },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transactions = linkedTransactions.map(transaction => ({
      reference: transaction.reference,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      beneficiaryName: transaction.beneficiaryName,
      beneficiaryRef: transaction.beneficiaryRef,
      createdAt: transaction.createdAt.toISOString(),
      account: {
        accountNumber: transaction.account.accountNumber,
        currency: transaction.account.currency,
      },
    }));

    return {
      transactions,
    };
  }


  // Fetch the customer's 10 most recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      account: {
        customerId: state.customerId,
      },
    },
    include: {
      account: {
        select: {
          accountNumber: true,
          currency: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Fetch the specifically mentioned transaction, if provided
  let referencedTransaction = null;

  if (state.transactionReference) {
    referencedTransaction = await prisma.transaction.findFirst({
      where: {
        reference: state.transactionReference,
        account: {
          customerId: state.customerId,
        },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            currency: true,
          },
        },
      },
    });
  }

  // Combine both results without duplicates
  const combinedTransactions = [
    ...recentTransactions,
    ...(referencedTransaction ? [referencedTransaction] : []),
  ];

  const uniqueTransactions = Array.from(
    new Map(
      combinedTransactions.map((transaction) => [
        transaction.id,
        transaction,
      ])
    ).values()
  );

  // Normalize Prisma Decimal and Date values for graph state
  const transactions = uniqueTransactions.map((transaction) => ({
    reference: transaction.reference,
    amount: transaction.amount.toString(),
    type: transaction.type,
    status: transaction.status,
    description: transaction.description,
    beneficiaryName: transaction.beneficiaryName,
    beneficiaryRef: transaction.beneficiaryRef,
    createdAt: transaction.createdAt.toISOString(),
    account: {
      accountNumber: transaction.account.accountNumber,
      currency: transaction.account.currency,
    },
  }));

  console.log(
    `Retrieved ${transactions.length} transactions`
  );

  return {
    transactions,
  };
}


async function detectDuplicates(
  state: typeof InvestigationState.State
) {
  console.log("Checking potential duplicate transactions...");

  // Only investigate duplicate complaints
  if (
    state.classification?.category !== "DUPLICATE_TRANSACTION"
  ) {
    return {
      duplicateCandidates: [],
    };
  }

  const transactions = state.transactions as Array<{
    reference: string;
    amount: string;
    type: string;
    description: string;
    beneficiaryName?: string | null;
    createdAt: string;
    account: {
      accountNumber: string;
      currency: string;
    };
  }>;

  const candidates = [];

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const first = transactions[i];
      const second = transactions[j];

      const sameAmount =
        Number(first.amount) === Number(second.amount);

      const bothDebits =
        first.type === "DEBIT" &&
        second.type === "DEBIT";

      const sameAccount =
        first.account.accountNumber ===
        second.account.accountNumber;

      const sameDescription =
        first.description?.trim().toLowerCase() ===
        second.description?.trim().toLowerCase();

      const sameBeneficiary =
        Boolean(first.beneficiaryName) &&
        Boolean(second.beneficiaryName) &&
        first.beneficiaryName?.trim().toLowerCase() ===
        second.beneficiaryName?.trim().toLowerCase();

      const timeDifference = Math.abs(
        new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime()
      );

      const within24Hours =
        timeDifference <= 24 * 60 * 60 * 1000;

      if (
        sameAmount &&
        bothDebits &&
        sameAccount &&
        (sameDescription || sameBeneficiary) &&
        within24Hours
      ) {
        candidates.push({
          firstTransaction: first.reference,
          secondTransaction: second.reference,
          amount: first.amount,
          currency: first.account.currency,
          description: first.description,
          beneficiaryName: first.beneficiaryName,
          timeDifferenceMs: timeDifference,
          status: "POTENTIAL_DUPLICATE",
        });
      }
    }
  }

  console.log(
    `Found ${candidates.length} potential duplicate pairs`
  );

  return {
    duplicateCandidates: candidates,
  };
}


function routeAfterClassification(
  state: typeof InvestigationState.State
) {
  if (state.classification?.requiresInvestigation) {
    return "retrieveTransactions";
  }

  return "retrieveRelevantPolicies";
}


async function analyzeFailedTransaction(
  state: typeof InvestigationState.State
) {
  console.log("Analyzing failed transaction evidence...");

  const transactions = state.transactions as Array<{
    reference: string;
    amount: string;
    type: string;
    status: string;
    description: string;
    beneficiaryName?: string | null;
    beneficiaryRef?: string | null;
    createdAt: string;
    account: {
      accountNumber: string;
      currency: string;
    };
  }>;

  // Consider only debit transactions
  const debitTransactions = transactions.filter(
    (transaction) => {
      const isDebit = transaction.type === "DEBIT";

      const matchesReference = state.transactionReference
        ? transaction.reference === state.transactionReference
        : true;

      return isDebit && matchesReference;
    }
  );

  if (debitTransactions.length === 0) {
    return {
      failedTransactionAnalysis: {
        status: "TRANSACTION_NOT_FOUND",
        message: "No debit transaction evidence was found.",
        transactions: [],
      },
    };
  }

  const analysis = debitTransactions.map((transaction) => {
    let investigationStatus: string;
    let explanation: string;

    switch (transaction.status) {
      case "FAILED":
        investigationStatus = "FAILED";
        explanation =
          "The transaction is marked as FAILED in the banking records.";
        break;

      case "PENDING":
        investigationStatus = "PENDING";
        explanation =
          "The transaction is pending. Final settlement is not yet confirmed.";
        break;

      case "SUCCESS":
        investigationStatus = "SUCCESS";
        explanation =
          "The transaction is marked as SUCCESS. Beneficiary credit confirmation is not available in the current demo data.";
        break;

      default:
        investigationStatus = "UNKNOWN";
        explanation =
          "The transaction status could not be determined.";
    }

    return {
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.account.currency,
      accountNumber: transaction.account.accountNumber,
      beneficiaryName: transaction.beneficiaryName,
      beneficiaryRef: transaction.beneficiaryRef,
      transactionStatus: transaction.status,
      investigationStatus,
      explanation,
    };
  });

  return {
    failedTransactionAnalysis: {
      status: "ANALYSIS_COMPLETED",
      transactions: analysis,
    },
  };
}

async function analyzeUnrecognizedTransaction(
  state: typeof InvestigationState.State
) {
  console.log("Analyzing unrecognized transaction...");

  const transactions = state.transactions as Array<{
    reference: string;
    amount: string;
    type: string;
    status: string;
    description: string;
    beneficiaryName?: string | null;
    createdAt: string;
    account: {
      accountNumber: string;
      currency: string;
    };
  }>;

  // Only debit transactions are relevant
  const debitTransactions = transactions.filter(
    (transaction) => transaction.type === "DEBIT"
  );

  if (debitTransactions.length === 0) {
    return {
      unrecognizedTransactionAnalysis: {
        status: "TRANSACTION_NOT_FOUND",
        message: "No debit transaction evidence was found.",
        customerConfirmationRequired: false,
        transactions: [],
      },
    };
  }

  const analysis = debitTransactions.map((transaction) => ({
    reference: transaction.reference,
    amount: transaction.amount,
    currency: transaction.account.currency,
    description: transaction.description,
    beneficiaryName: transaction.beneficiaryName,
    transactionStatus: transaction.status,
    transactionDate: transaction.createdAt,
    investigationStatus: "CUSTOMER_REVIEW_REQUIRED",
    customerConfirmationRequired: true,
    explanation:
      "This debit transaction was found in the customer's account records. The customer must confirm whether they recognize it. This finding alone does not establish fraud.",
  }));

  return {
    unrecognizedTransactionAnalysis: {
      status: "CUSTOMER_REVIEW_REQUIRED",
      customerConfirmationRequired: true,
      transactions: analysis,
    },
  };
}

async function retrieveRelevantPolicies(
  state: typeof InvestigationState.State
) {
  const results = await searchPolicies(state.message, 3);

  const categoryPolicyMap: Record<string, string> = {
    DUPLICATE_TRANSACTION: "BANK-DT-001",
    FAILED_TRANSACTION: "BANK-FT-001",
    UNRECOGNIZED_TRANSACTION: "BANK-UT-001",
  };

  const expectedDocumentId = state.classification?.category
    ? categoryPolicyMap[
    state.classification.category as string
    ]
    : undefined;

  const relevantPolicies = results.filter((policy) => {
    const meetsSimilarityThreshold = policy.similarity >= 0.6;

    const matchesCategory = expectedDocumentId
      ? policy.documentId === expectedDocumentId
      : true;

    return meetsSimilarityThreshold && matchesCategory;
  });

  console.log(
    `[RAG] Retrieved ${results.length} policies. ` +
    `${relevantPolicies.length} relevant policies for ` +
    `${state.classification?.category ?? "GENERAL_BANKING"}`
  );

  return {
    policyResults: relevantPolicies,
  };
}

function buildStructuredEvidence(
  state: typeof InvestigationState.State
): InvestigationEvidence[] {
  const evidence = new Map<string, InvestigationEvidence>();

  const transactions = state.transactions as Array<{
    reference: string;
    amount: string;
    type: string;
    status: string;
    account: {
      currency: string;
    };
  }>;

  const addEvidence = (
    reference: string,
    amount: string,
    currency: string,
    status: string,
    evidenceType: "TRANSACTION" | "POTENTIAL_DUPLICATE"
  ) => {
    if (!["SUCCESS", "PENDING", "FAILED"].includes(status)) {
      return;
    }

    evidence.set(reference, {
      transactionReference: reference,
      amount,
      currency,
      transactionStatus: status as
        | "SUCCESS"
        | "PENDING"
        | "FAILED",
      evidenceType,
    });
  };

  switch (state.classification?.category) {
    case "DUPLICATE_TRANSACTION": {
      for (const candidate of state.duplicateCandidates) {
        const firstReference =
          candidate.firstTransaction as string;

        const secondReference =
          candidate.secondTransaction as string;

        for (const reference of [
          firstReference,
          secondReference,
        ]) {
          const transaction = transactions.find(
            (item) => item.reference === reference
          );

          if (transaction) {
            addEvidence(
              transaction.reference,
              transaction.amount,
              transaction.account.currency,
              transaction.status,
              "POTENTIAL_DUPLICATE"
            );
          }
        }
      }

      break;
    }

    case "FAILED_TRANSACTION": {
      const analysis = state.failedTransactionAnalysis as {
        transactions?: Array<{
          reference: string;
          amount: string;
          currency: string;
          transactionStatus: string;
        }>;
      } | undefined;

      for (const item of analysis?.transactions ?? []) {
        addEvidence(
          item.reference,
          item.amount,
          item.currency,
          item.transactionStatus,
          "TRANSACTION"
        );
      }

      break;
    }

    case "UNRECOGNIZED_TRANSACTION": {
      const analysis =
        state.unrecognizedTransactionAnalysis as {
          transactions?: Array<{
            reference: string;
            amount: string;
            currency: string;
            transactionStatus: string;
          }>;
        } | undefined;

      for (const item of analysis?.transactions ?? []) {
        addEvidence(
          item.reference,
          item.amount,
          item.currency,
          item.transactionStatus,
          "TRANSACTION"
        );
      }

      break;
    }
  }

  return Array.from(evidence.values());
}

function getInvestigationStatus(
  state: typeof InvestigationState.State
): InvestigationResult["investigationStatus"] {
  switch (state.classification?.category) {
    case "DUPLICATE_TRANSACTION":
      return state.duplicateCandidates.length > 0
        ? "POTENTIAL_DUPLICATE"
        : "NEEDS_MORE_INFORMATION";

    case "FAILED_TRANSACTION": {
      const analysis = state.failedTransactionAnalysis as {
        status?: string;
        transactions?: Array<{
          investigationStatus: string;
        }>;
      } | undefined;

      if (analysis?.status === "TRANSACTION_NOT_FOUND") {
        return "TRANSACTION_NOT_FOUND";
      }

      const status =
        analysis?.transactions?.[0]?.investigationStatus;

      if (
        status === "FAILED" ||
        status === "PENDING" ||
        status === "SUCCESS"
      ) {
        return status;
      }

      return "NEEDS_MORE_INFORMATION";
    }

    case "UNRECOGNIZED_TRANSACTION": {
      const analysis =
        state.unrecognizedTransactionAnalysis as {
          status?: string;
        } | undefined;

      return analysis?.status === "CUSTOMER_REVIEW_REQUIRED"
        ? "CUSTOMER_REVIEW_REQUIRED"
        : "TRANSACTION_NOT_FOUND";
    }

    default:
      return state.policyResults.length > 0
        ? "POLICY_ONLY"
        : "NEEDS_MORE_INFORMATION";
  }
}

async function generatePolicyGroundedResponse(
  state: typeof InvestigationState.State
) {
  const investigationEvidence = {
    classification: state.classification,
    transactionReference: state.transactionReference,
    duplicateCandidates: state.duplicateCandidates,
    failedTransactionAnalysis: state.failedTransactionAnalysis,
    unrecognizedTransactionAnalysis:
      state.unrecognizedTransactionAnalysis,
  };

  // Preserve existing customer-facing RAG response.
  const policyAnswer = await generatePolicyAnswer(
    state.message,
    state.policyResults,
    investigationEvidence
  );

  // Build trusted evidence from deterministic analysis.
  const evidence = buildStructuredEvidence(state);

  const classification = state.classification;

  if (!classification) {
    throw new Error(
      "Classification is missing from investigation state"
    );
  }

  const category = classification.category as
    | "FAILED_TRANSACTION"
    | "DUPLICATE_TRANSACTION"
    | "UNRECOGNIZED_TRANSACTION"
    | "GENERAL_BANKING";

  const confidence =
    typeof classification.confidence === "number"
      ? classification.confidence
      : 0;

  const investigationStatus = getInvestigationStatus(state);

  // Policy references come exclusively from retrieved policies.
  const policyReferences = [
    ...new Set(
      state.policyResults.map((policy) => policy.documentId)
    ),
  ];

  const structuredResult =
    await generateStructuredInvestigation({
      category,
      confidence,
      investigationStatus,
      evidence,
      policyReferences,
      customerMessage: state.message,
    });

  console.log(
    "[Investigation] Structured result generated:",
    structuredResult.investigationStatus
  );

  console.log(
    `[RAG] Policy answer generated. Grounded: ${policyAnswer.grounded}`
  );

  return {
    policyAnswer,
    structuredResult,
  };
}

function routeAfterTransactionRetrieval(
  state: typeof InvestigationState.State
) {
  switch (state.classification?.category) {
    case "DUPLICATE_TRANSACTION":
      return "detectDuplicates";

    case "FAILED_TRANSACTION":
      return "analyzeFailedTransaction";

    case "UNRECOGNIZED_TRANSACTION":
      return "analyzeUnrecognizedTransaction";

    default:
      return END;
  }
}

// 3. Define a simple graph
// 3. Define and connect the investigation graph
const graph = new StateGraph(InvestigationState)

  // Register all nodes first
  .addNode("classifyComplaint", classifyComplaint)
  .addNode("retrieveTransactions", retrieveTransactions)
  .addNode("detectDuplicates", detectDuplicates)
  .addNode("analyzeFailedTransaction", analyzeFailedTransaction)
  .addNode(
    "analyzeUnrecognizedTransaction",
    analyzeUnrecognizedTransaction
  )
  .addNode("retrieveRelevantPolicies", retrieveRelevantPolicies)
  .addNode(
    "generatePolicyGroundedResponse",
    generatePolicyGroundedResponse
  )

  // Starting point
  .addEdge(START, "classifyComplaint")

  // Route based on classification
  .addConditionalEdges(
    "classifyComplaint",
    routeAfterClassification,
    {
      retrieveTransactions: "retrieveTransactions",
      retrieveRelevantPolicies: "retrieveRelevantPolicies",
    }
  )

  // Route based on investigation category
  .addConditionalEdges(
    "retrieveTransactions",
    routeAfterTransactionRetrieval,
    {
      detectDuplicates: "detectDuplicates",
      analyzeFailedTransaction: "analyzeFailedTransaction",
      analyzeUnrecognizedTransaction:
        "analyzeUnrecognizedTransaction",
      [END]: END,
    }
  )

  // All investigation branches continue to policy retrieval
  .addEdge("detectDuplicates", "retrieveRelevantPolicies")
  .addEdge(
    "analyzeFailedTransaction",
    "retrieveRelevantPolicies"
  )
  .addEdge(
    "analyzeUnrecognizedTransaction",
    "retrieveRelevantPolicies"
  )

  // RAG pipeline
  .addEdge(
    "retrieveRelevantPolicies",
    "generatePolicyGroundedResponse"
  )
  .addEdge("generatePolicyGroundedResponse", END)

  .compile();

// 4. Export graph
export { graph };