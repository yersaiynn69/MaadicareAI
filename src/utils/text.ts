/**
 * Text utility functions for normalization and processing
 */

export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function extractJSON(text: string): string | null {
  // Try to extract JSON from text that might have surrounding content
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

