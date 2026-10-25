import { z } from "zod";

// ==========================================
// 1. Tool Calling Schemas (from PRD §7.3)
// ==========================================

export const EmitBriefingSchema = z.object({
  summary: z.string().describe("Max 2 sentences. What changed, in the developer's register."),
  risk: z.string().optional().describe("One sentence naming the risk and its consequence."),
  anchor: z
    .string()
    .regex(/^[^:]+:\d+(-\d+)?$/, "Anchor must be in format 'file:line' or 'file:start-end'")
    .optional()
    .describe("file:line of the risk."),
  severity: z.enum(["low", "medium", "high"]),
  skip_reason: z
    .string()
    .optional()
    .describe("Set when the diff is trivial; no question will be asked."),
});

export type EmitBriefing = z.infer<typeof EmitBriefingSchema>;

export const AskDecisionSchema = z.object({
  question: z.string().max(220).describe("Exactly one question forcing an architectural choice."),
  options: z.array(z.string()).min(2).max(4).describe("2 to 4 distinct options."),
  why_now: z.string().optional().describe("Why this cannot wait until after the build."),
  anchor: z
    .string()
    .regex(/^[^:]+:\d+(-\d+)?$/)
    .describe("file:line tied to the question."),
});

export type AskDecision = z.infer<typeof AskDecisionSchema>;

export const WriteDecisionRecordSchema = z.object({
  title: z.string().max(70).describe("Concise decision title."),
  context: z.string().describe("2-4 sentences: what in the diff forced this."),
  decision: z.string().describe("The choice, in the developer's own words where possible."),
  consequences: z.array(z.string()).min(1).max(4).describe("Immediate trade-offs and side effects."),
  alternatives: z.array(z.string()).optional().describe("Alternative approaches considered."),
  anchors: z
    .array(z.string().regex(/^[^:]+:\d+(-\d+)?$/))
    .min(1)
    .describe("Files and lines affected."),
});

export type WriteDecisionRecord = z.infer<typeof WriteDecisionRecordSchema>;

export const RecordSessionMetricSchema = z.object({
  session_id: z.string(),
  wait_ms: z.number().int(),
  decision_captured: z.boolean(),
});

export type RecordSessionMetric = z.infer<typeof RecordSessionMetricSchema>;

// ==========================================
// 2. Data Models (from PRD §8.1)
// ==========================================

export const HunkSchema = z.object({
  file: z.string(),
  startLine: z.number().int(),
  endLine: z.number().int(),
  added: z.array(z.string()),
  removed: z.array(z.string()),
  language: z.string().default("typescript"),
});

export type Hunk = z.infer<typeof HunkSchema>;

export const BuildSessionSchema = z.object({
  id: z.string(),
  repo: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  waitMs: z.number().default(0),
  files: z.array(z.string()),
  linesAdded: z.number().default(0),
  linesRemoved: z.number().default(0),
  hunks: z.array(HunkSchema).default([]),
  status: z.enum(["waiting", "briefing", "awaiting_answer", "answered", "skipped"]),
  register: z.enum(["beginner", "pro"]).default("beginner"),
  lang: z.enum(["hi", "en-IN"]).default("hi"),
});

export type BuildSession = z.infer<typeof BuildSessionSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  question: z.string(),
  answerText: z.string(),
  answerSource: z.enum(["wispr", "typed", "option"]),
  adrPath: z.string(),
  createdAt: z.number(),
});

export type Decision = z.infer<typeof DecisionSchema>;

// ==========================================
// 3. UI data shapes for the frontend (PROMPT_FOR_UI_DEV.md)
// ==========================================

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface DiffHunk {
  file: string;
  startLine: number;
  endLine: number;
  lines: string[];
}

export interface ParsedDiff {
  files: string[];
  linesAdded: number;
  linesRemoved: number;
  hunks: DiffHunk[];
  summary: string;
  risk: string;
  anchor: string; // "src/auth/rotate.ts:44-58"
  severity: Severity;
  question: string;
  options: string[];
  why_now: string;
  sessionId: string;
}

export interface AdrRequest {
  title?: string;
  context?: string;
  decision: string;
  consequences?: string[];
  alternatives?: string[];
  anchors?: string[];
  rawSpeech?: string;
  sessionId?: string;
}

export interface AdrResponse {
  success: boolean;
  fileName: string;
  path: string;
  content: string;
  fileSavedOnDisk: boolean;
  constraintsUpdated?: boolean;
}

/* ---- Local UI state shapes ---- */

export type SessionStatus =
  | "idle"
  | "building"
  | "briefing"
  | "question"
  | "answered"
  | "skipped"
  | "error";

export interface SessionRecord {
  id: string;
  status: SessionStatus;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
  createdAt: number;
  question?: string;
  decision?: string;
  adrPath?: string;
}

export interface DecisionNode {
  id: string;
  anchor: string;
  file: string;
  question: string;
  decision: string;
  adrPath: string;
  createdAt: number;
}

export interface Telemetry {
  waitMsSaved: number;
  decisionsCaptured: number;
  sessionsSeen: number;
  avgDecisionLatencyMs: number;
  rawMetrics: string[];
}

export const EMPTY_TELEMETRY: Telemetry = {
  waitMsSaved: 0,
  decisionsCaptured: 0,
  sessionsSeen: 0,
  avgDecisionLatencyMs: 0,
  rawMetrics: [],
};
