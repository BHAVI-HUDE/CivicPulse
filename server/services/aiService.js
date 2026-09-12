import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const CATEGORIES = ["Road", "Water", "Sanitation", "Streetlight", "Traffic", "Other"];

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Flash-Lite is the right fit here: both calls are short, structured
// classification/matching tasks, not open-ended reasoning, so the
// cheapest high-volume tier is plenty. Override with GEMINI_MODEL if
// you want to try a full Flash model for tougher severity judgments.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Small helper: every AI call gets a hard timeout so a slow/hung API
// call never blocks a citizen from submitting a report.
const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI call timed out")), ms)),
  ]);

const classifySchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: { type: SchemaType.STRING, enum: CATEGORIES },
    severity: { type: SchemaType.INTEGER },
    rationale: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
  },
  required: ["category", "severity", "rationale", "confidence"],
};

const duplicateSchema = {
  type: SchemaType.OBJECT,
  properties: {
    duplicateId: { type: SchemaType.STRING, nullable: true },
    confidence: { type: SchemaType.NUMBER },
  },
  required: ["confidence"],
};

/**
 * Used only when the AI is unavailable/unconfigured/fails. A flat
 * default of 5 for every report would make the priority queue useless
 * during an outage, so this does a cheap keyword pass instead.
 */
export function estimateSeverityFallback(description = "") {
  const text = description.toLowerCase();
  let severity = 4;
  if (/danger|hazard|injur|electrocut|exposed wire|accident|collapse/.test(text)) severity += 4;
  if (/leak|overflow|no water|sewage|block(ing|ed)/.test(text)) severity += 2;
  if (/school|hospital|children|elderly/.test(text)) severity += 1;
  return Math.min(10, Math.max(1, severity));
}

/**
 * Classifies a report's category and estimates severity using Gemini.
 * Returns null if the AI is unavailable or the call fails — callers
 * must fall back to the deterministic rules in that case.
 */
export async function classifyAndScoreIssue(description) {
  if (!genAI || !description) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction:
        "You triage civic infrastructure reports for a city government. " +
        "Severity 1-3 is minor/cosmetic, 4-6 is a real inconvenience, 7-8 is a safety hazard, " +
        "9-10 is an immediate danger to life (e.g. exposed wiring, deep pothole near a school, " +
        "major water main break).",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: classifySchema,
      },
    });

    const result = await withTimeout(model.generateContent(description));
    const parsed = JSON.parse(result.response.text());

    if (!CATEGORIES.includes(parsed.category)) return null;
    const severity = Math.min(10, Math.max(1, Math.round(Number(parsed.severity))));
    if (!Number.isFinite(severity)) return null;

    return {
      category: parsed.category,
      severity,
      rationale: String(parsed.rationale || "").slice(0, 300),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  } catch (error) {
    console.error("AI classification failed, falling back to rules:", error.message);
    return null;
  }
}

/**
 * Checks a new report's description against a small set of candidate
 * issues (already filtered by ward + category) to see if it's a
 * duplicate of something already reported. Returns the matching
 * issue's id, or null if no match / AI unavailable.
 */
export async function findDuplicateIssue(description, candidates) {
  if (!genAI || !description || !candidates?.length) return null;

  try {
    const candidateList = candidates
      .map((c, i) => `${i + 1}. [id:${c._id}] ${c.title} — ${c.description}`)
      .join("\n");

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction:
        "You detect duplicate civic issue reports. Given a NEW report and a numbered list of " +
        "EXISTING open reports, decide if the new one describes the same real-world problem as " +
        "one of the existing ones (same issue, not just the same category). If none match, " +
        "return duplicateId as null.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: duplicateSchema,
      },
    });

    const prompt = `NEW report: ${description}\n\nEXISTING open reports:\n${candidateList}`;
    const result = await withTimeout(model.generateContent(prompt));
    const parsed = JSON.parse(result.response.text());
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));

    if (!parsed.duplicateId || confidence < 0.75) return null;
    const match = candidates.find((c) => String(c._id) === String(parsed.duplicateId));
    return match ? { issueId: match._id, confidence } : null;
  } catch (error) {
    console.error("AI duplicate check failed, skipping:", error.message);
    return null;
  }
}