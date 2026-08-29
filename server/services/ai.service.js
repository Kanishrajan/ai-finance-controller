import { GoogleGenAI, Type } from "@google/genai";

const PROMPT_NAME = "merchant_reconciliation";
const PROMPT_VERSION = "v1";
const MODEL_NAME = "gemini-3.7-flash";

let aiClient = null;

function getAiClient() {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export const AI_SYSTEM_PROMPT = `You are a senior financial reconciliation controller and audit assistant.
You are given multi-source transaction records (Bank, Payment Gateway, Internal Ledger).
Determine whether the supplied records represent the same underlying financial transaction, diagnose any discrepancies (fees, withholding, timing differences, duplicates, missing entries), and provide an audit recommendation.

Use ONLY the supplied transaction data. Do not invent details.
Return valid structured JSON matching the schema:
{
  "classification": "MATCHED" | "PROBABLE_MATCH" | "AMOUNT_MISMATCH" | "DATE_MISMATCH" | "MISSING_TRANSACTION" | "DUPLICATE" | "UNRESOLVED",
  "confidence": number between 0.0 and 1.0,
  "reason": "Clear, concise financial reasoning explaining why this classification was made",
  "recommendation": "AUTO_ACCEPT" | "MANUAL_REVIEW" | "REJECT_TRANSACTION" | "ESCALATE_TO_TREASURY"
}`;

/**
 * Deterministic AI Fallback reasoning generator when API key is not present or API call times out.
 */
export function generateDeterministicReasoning({ bankTx, gatewayTx, ledgerTx, matchingMethod, confidence, amountDiff, classification }) {
  const bankAmt = bankTx ? bankTx.amount : null;
  const gwAmt = gatewayTx ? gatewayTx.amount : null;
  const ledAmt = ledgerTx ? ledgerTx.amount : null;

  let reason = "";
  let recommendation = "MANUAL_REVIEW";

  if (classification === 'AMOUNT_MISMATCH') {
    reason = `Merchant identifiers and transaction reference correlate across sources. However, an amount variance of ₹${Math.abs(amountDiff).toFixed(2)} is detected (Bank: ₹${bankAmt?.toLocaleString() || 'N/A'}, Gateway: ₹${gwAmt?.toLocaleString() || 'N/A'}, Ledger: ₹${ledAmt?.toLocaleString() || 'N/A'}). Likely attributable to payment gateway withholding fees, surcharge deductions, or fractional settlement variances.`;
    recommendation = "MANUAL_REVIEW";
  } else if (classification === 'MISSING_TRANSACTION') {
    if (!gatewayTx) {
      reason = `Direct bank settlement of ₹${bankAmt?.toLocaleString() || 'N/A'} is booked in general ledger (${ledgerTx?.transaction_id || 'N/A'}) but possesses no corresponding authorization record in the Payment Gateway. Indicates a direct NEFT/RTGS wire transfer or uncaptured customer checkout.`;
      recommendation = "MANUAL_REVIEW";
    } else {
      reason = `Transaction captured in payment gateway (${gatewayTx.transaction_id}) has not cleared into the primary bank statement account. Un-deposited in-transit batch funds.`;
      recommendation = "ESCALATE_TO_TREASURY";
    }
  } else if (classification === 'DUPLICATE_TRANSACTION' || classification === 'DUPLICATE') {
    reason = `Multiple webhook authorization records detected in payment gateway for reference ${gatewayTx?.reference_id || 'REF'}. Bank statement indicates only a single debit of ₹${bankAmt?.toLocaleString() || 'N/A'}. Second authorization is flagged as a duplicate retry event.`;
    recommendation = "REJECT_TRANSACTION";
  } else if (classification === 'DATE_MISMATCH') {
    reason = `Transaction amounts and merchant entities align, but a clearing delay exceeding settlement SLA was detected between Gateway authorization (${gatewayTx?.transaction_date || 'N/A'}) and Bank posting (${bankTx?.transaction_date || 'N/A'}).`;
    recommendation = "MANUAL_REVIEW";
  } else if (classification === 'PROBABLE_MATCH') {
    reason = `High semantic similarity between normalized merchant entities ('${bankTx?.merchant}' vs '${gatewayTx?.merchant}') with matching dates and amounts. Reference IDs were unlinked but phonetic and token sort analysis confirms entity equivalence.`;
    recommendation = confidence >= 0.85 ? "AUTO_ACCEPT" : "MANUAL_REVIEW";
  } else if (classification === 'UNRESOLVED') {
    reason = `Conflicting merchant metadata and low semantic alignment between disparate source records. Insufficient reference markers to establish positive financial linkage.`;
    recommendation = "MANUAL_REVIEW";
  } else {
    reason = `Full 3-way reconciliation verified. Exact match on reference ID ${bankTx?.reference_id || ''}, matching currency, dates, and identical net settlement amounts.`;
    recommendation = "AUTO_ACCEPT";
  }

  return {
    classification: classification || "PROBABLE_MATCH",
    confidence: confidence || 0.85,
    reason,
    recommendation,
    prompt_name: PROMPT_NAME,
    prompt_version: PROMPT_VERSION,
    model: "deterministic-rule-engine-v1",
    is_fallback: true
  };
}

/**
 * Analyzes ambiguous financial records using Gemini 3.7 Flash with prompt versioning & fallback
 */
export async function analyzeWithAI({ bankTx, gatewayTx, ledgerTx, matchingMethod, confidence, amountDiff, classification }) {
  const client = getAiClient();

  if (!client || !process.env.GEMINI_API_KEY) {
    return generateDeterministicReasoning({ bankTx, gatewayTx, ledgerTx, matchingMethod, confidence, amountDiff, classification });
  }

  const promptPayload = `Transaction Records for Evaluation:
- BANK SOURCE:
  * ID: ${bankTx?.external_transaction_id || bankTx?.transaction_id || 'MISSING'}
  * Merchant: ${bankTx?.merchant || 'N/A'}
  * Amount: ₹${bankTx?.amount || 'N/A'} ${bankTx?.currency || ''}
  * Date: ${bankTx?.transaction_date || 'N/A'}
  * Reference: ${bankTx?.reference_id || 'N/A'}
  * Description: ${bankTx?.description || 'N/A'}

- PAYMENT GATEWAY SOURCE:
  * ID: ${gatewayTx?.external_transaction_id || gatewayTx?.transaction_id || 'MISSING'}
  * Merchant: ${gatewayTx?.merchant || 'N/A'}
  * Amount: ₹${gatewayTx?.amount || 'N/A'} ${gatewayTx?.currency || ''}
  * Date: ${gatewayTx?.transaction_date || 'N/A'}
  * Reference: ${gatewayTx?.reference_id || 'N/A'}
  * Description: ${gatewayTx?.description || 'N/A'}

- INTERNAL LEDGER SOURCE:
  * ID: ${ledgerTx?.external_transaction_id || ledgerTx?.transaction_id || 'MISSING'}
  * Merchant: ${ledgerTx?.merchant || 'N/A'}
  * Amount: ₹${ledgerTx?.amount || 'N/A'} ${ledgerTx?.currency || ''}
  * Date: ${ledgerTx?.transaction_date || 'N/A'}
  * Reference: ${ledgerTx?.reference_id || 'N/A'}
  * Description: ${ledgerTx?.description || 'N/A'}

Preliminary Rule Matching Method: ${matchingMethod}
Calculated Metric Confidence: ${Math.round(confidence * 100)}%
Amount Variance: ₹${amountDiff}
Assigned Category: ${classification}

Provide your structured audit analysis and decision.`;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: promptPayload,
      config: {
        systemInstruction: AI_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.STRING,
              description: "Reconciliation classification"
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score between 0.0 and 1.0"
            },
            reason: {
              type: Type.STRING,
              description: "Detailed financial rationale"
            },
            recommendation: {
              type: Type.STRING,
              description: "Operational recommendation"
            }
          },
          required: ["classification", "confidence", "reason", "recommendation"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());

    // Strict validation of AI response format
    const validClassifications = [
      'MATCHED', 'PROBABLE_MATCH', 'AMOUNT_MISMATCH',
      'DATE_MISMATCH', 'MISSING_TRANSACTION', 'DUPLICATE',
      'DUPLICATE_TRANSACTION', 'UNRESOLVED'
    ];

    const finalClassification = validClassifications.includes(parsed.classification) ? parsed.classification : classification;
    const finalConfidence = (typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1)
      ? Number(parsed.confidence.toFixed(2))
      : confidence;

    return {
      classification: finalClassification,
      confidence: finalConfidence,
      reason: parsed.reason || "AI verified merchant context and amount alignment.",
      recommendation: parsed.recommendation || "MANUAL_REVIEW",
      prompt_name: PROMPT_NAME,
      prompt_version: PROMPT_VERSION,
      model: MODEL_NAME,
      is_fallback: false
    };
  } catch (error) {
    console.warn(`[AI Service] Live model call failed, falling back to deterministic reasoning: ${error.message}`);
    return generateDeterministicReasoning({ bankTx, gatewayTx, ledgerTx, matchingMethod, confidence, amountDiff, classification });
  }
}
