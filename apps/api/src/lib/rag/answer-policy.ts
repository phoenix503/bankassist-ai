import { geminiModel } from "@/lib/ai/gemini";
import { searchPolicies } from "@/lib/rag/search-policy";

const MIN_SIMILARITY = 0.6;

export type PolicySearchResult = {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  content: string;
  chunkIndex: number;
  similarity: number;
};

export async function generatePolicyAnswer(
  query: string,
  relevantPolicies: PolicySearchResult[],
  investigationEvidence?: Record<string, unknown>
) {
  if (relevantPolicies.length === 0) {
    return {
      answer:
        "I could not find a sufficiently relevant banking policy to answer this question. Please contact a banking support representative.",
      citations: [],
      grounded: false,
      reason: "NO_RELEVANT_POLICY_FOUND",
      threshold: MIN_SIMILARITY,
    };
  }

  const evidenceContext = investigationEvidence
    ? JSON.stringify(investigationEvidence, null, 2)
    : "No transaction investigation evidence available.";
    
  const policyContext = relevantPolicies
    .map(
      (policy) => `
Policy: ${policy.title}
Document ID: ${policy.documentId}
Source: ${policy.source}
Content:
${policy.content}
`
    )
    .join("\n---\n");

  const response = await geminiModel.invoke([
    [
      "system",
      `You are BankAssist AI, a banking investigation assistant.

Your responsibilities:
1. Answer using ONLY the supplied banking policy context and investigation evidence.
2. Use available transaction evidence to explain actual investigation findings.
3. Never ask customers to provide information already present in the evidence.
4. Clearly explain transaction references, amounts, dates and statuses when available.
5. Explain the next steps according to the supplied policy.
6. Never promise a reversal, refund or resolution unless the evidence confirms it.
7. A FAILED transaction may be reviewed for applicable reversal, but do not claim reversal has happened.
8. A SUCCESS transaction does not independently prove beneficiary credit.
9. Matching transactions are potential duplicates, not confirmed duplicates.
10. If evidence is missing, clearly identify what additional information is needed.
11. Use a professional, empathetic and customer-friendly tone.
12. Do not invent investigation reference numbers.

Provide a concise response based on the available evidence.`,
    ],
    [
      "human",
      `Customer question:
${query}

Investigation evidence:
${evidenceContext}

Relevant banking policy context:
${policyContext}

Generate a response explaining the actual findings and appropriate next steps.`,
    ],
  ]);

  
  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return {
    answer,
    citations: relevantPolicies.map((policy) => ({
      documentId: policy.documentId,
      title: policy.title,
      source: policy.source,
      chunkId: policy.chunkId,
      similarity: policy.similarity,
    })),
    grounded: true,
    threshold: MIN_SIMILARITY,
  };
}

export async function answerPolicyQuestion(query: string) {
  const retrievedPolicies = await searchPolicies(query, 3);

  const relevantPolicies = retrievedPolicies.filter(
    (policy) => policy.similarity >= MIN_SIMILARITY
  );

  return generatePolicyAnswer(query, relevantPolicies);
}