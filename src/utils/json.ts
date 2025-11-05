import { z } from "zod";

const HandoffSchema = z.object({
  intent: z.literal("handoff_to_operator"),
  reason: z.string().min(1),
});

const ReferralSchema = z.object({
  intent: z.enum(["make_referral", "no_referral_needed"]),
  fio: z.string().optional(),
  preliminary_assessment: z.string().optional(),
  doctor_type: z.enum([
    "терапевт",
    "ЛОР",
    "дерматолог",
    "офтальмолог",
    "невролог",
    "кардиолог",
    "хирург",
    "травматолог",
    "эндокринолог",
    "гинеколог",
    "уролог",
    "гастроэнтеролог",
    "педиатр",
  ]).optional(),
  reason: z.string().optional(), // For "no_referral_needed"
}).refine(
  (data) => {
    if (data.intent === "make_referral") {
      return data.fio && data.preliminary_assessment && data.doctor_type;
    } else {
      return data.reason; // no_referral_needed should have reason
    }
  },
  {
    message: "Invalid referral response: make_referral requires fio, preliminary_assessment, doctor_type; no_referral_needed requires reason",
  }
);

export type HandoffResponse = z.infer<typeof HandoffSchema>;
export type ReferralResponse = z.infer<typeof ReferralSchema>;

/**
 * Extract and validate JSON from LLM response
 * @param raw - Raw text from LLM
 * @param kind - Type of expected response (handoff or referral)
 * @returns Validated JSON object
 */
export function extractAndValidateJSON(
  raw: string,
  kind: "handoff" | "referral"
): HandoffResponse | ReferralResponse {
  // Try to extract JSON block from the response
  // Look for the last occurrence of {...} in case there's text before
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : raw.trim();

  try {
    const parsed = JSON.parse(candidate);

    if (kind === "handoff") {
      return HandoffSchema.parse(parsed);
    } else {
      return ReferralSchema.parse(parsed);
    }
  } catch (e: any) {
    console.error("❌ JSON Parsing/Validation Error:", {
      kind,
      error: e.message,
      raw: raw.substring(0, 500), // Log first 500 chars
    });
    throw new Error(
      `Failed to parse/validate JSON: ${e.message}. Raw response: ${raw.substring(0, 200)}`
    );
  }
}

