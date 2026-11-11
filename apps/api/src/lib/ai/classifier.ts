
import { z } from "zod";
import { geminiModel } from "@/lib/ai/gemini";

export const responseSchema = z.object({
  category: z.enum([
    "FAILED_TRANSACTION",
    "DUPLICATE_TRANSACTION",
    "UNRECOGNIZED_TRANSACTION",
    "GENERAL_BANKING",
  ]),
  intent: z.string(),
  confidence: z.number(),
  requiresInvestigation: z.boolean(),
  explanation: z.string(),
});

export type Classification = z.infer<typeof responseSchema>;

export async function classifyBankingQuery(message: string) {
  const structuredModel = geminiModel.withStructuredOutput(
    responseSchema,
    { name: "banking_intent_classification" }
  );

  const result = await structuredModel.invoke([
    [
      "system",
      `You are BankAssist AI, a banking transaction intent classifier.

      Classify the customer's message into one category:

      FAILED_TRANSACTION:
      Money debited but beneficiary not credited.

      DUPLICATE_TRANSACTION:
      The same transaction appears to have been debited more than once.

      UNRECOGNIZED_TRANSACTION:
      Customer does not recognize a transaction.

      GENERAL_BANKING:
      Any other banking query.

      Set requiresInvestigation to true for the first three
      categories and false for general banking.

      Do not invent transaction details.
      Confidence is your estimated classification confidence,
      not a verified probability.

      Return only the required structured output.`,
    ],
    ["human", message],
  ]);

  return result;
}
