import { summaryLanguageInstruction } from './languages.js';

export function emptyNotes() {
  return { tldr: '', topics: [], decisions: [], openQuestions: [], actionItems: [] };
}

export function normalizeNotes(obj = {}) {
  const base = emptyNotes();
  return {
    tldr: typeof obj.tldr === 'string' ? obj.tldr : base.tldr,
    topics: Array.isArray(obj.topics) ? [...obj.topics] : base.topics,
    decisions: Array.isArray(obj.decisions) ? [...obj.decisions] : base.decisions,
    openQuestions: Array.isArray(obj.openQuestions) ? [...obj.openQuestions] : base.openQuestions,
    actionItems: Array.isArray(obj.actionItems) ? [...obj.actionItems] : base.actionItems,
  };
}

export const SUMMARY_PROMPT = `You are a meeting-notes assistant. Read the speaker-labeled transcript and return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{
  "tldr": "2-4 sentence overview",
  "topics": [{"title": "string", "points": ["string"]}],
  "decisions": ["string"],
  "openQuestions": ["string"],
  "actionItems": [{"assignee": "speaker display name or null", "task": "string"}]
}
Rules:
- Assign each action item to the speaker responsible using their display name; use null only if truly unassigned.
- Use the speaker names exactly as they appear in the transcript.
- If the transcript is short or unclear, still return the JSON with best-effort empty arrays.`;

// Wraps a server admin's custom context so it reads as background material, not
// as instructions that could countermand the JSON contract above. Shared by the
// summary prompt and the ask prompt.
export function customContextBlock(customContext) {
  const context = (customContext || '').trim();
  if (!context) return '';
  return `\n\nServer-provided context about this team/project (use it to interpret names, terms, and priorities):\n${context}`;
}

// The single assembly point for the summarizer prompt — every adapter calls
// this instead of concatenating its own copy, so the base instructions, the
// language directive, the per-guild custom context, and the meeting header
// can never drift between providers.
export function buildSummaryPrompt(transcript, meta = {}) {
  const header = `Meeting: ${meta.channelName || ''}${meta.date ? ` on ${meta.date}` : ''}\nAttendees: ${(meta.attendees || []).join(', ')}`;
  return `${SUMMARY_PROMPT}${summaryLanguageInstruction(meta.summaryLanguage)}${customContextBlock(meta.customContext)}\n\n${header}\n\nTranscript:\n${transcript}`;
}
