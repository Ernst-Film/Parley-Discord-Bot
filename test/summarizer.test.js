import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyNotes, normalizeNotes, SUMMARY_PROMPT, buildSummaryPrompt } from '../src/adapters/summarizer/notes.js';
import { FakeSummarizer } from '../src/adapters/summarizer/fake.js';
import { parseGeminiNotes } from '../src/adapters/summarizer/gemini.js';
import { getSummarizer } from '../src/adapters/summarizer/index.js';

test('normalizeNotes fills missing fields from empty shape', () => {
  const n = normalizeNotes({ tldr: 'x' });
  assert.equal(n.tldr, 'x');
  assert.deepEqual(n.topics, []);
  assert.deepEqual(n.actionItems, []);
});

test('SUMMARY_PROMPT instructs JSON output with action item assignees', () => {
  assert.match(SUMMARY_PROMPT, /JSON/);
  assert.match(SUMMARY_PROMPT, /assignee/);
});

test('buildSummaryPrompt composes base prompt, language, header, and transcript', () => {
  const p = buildSummaryPrompt('T-BODY', {
    channelName: 'general', date: '2026-07-27', attendees: ['Alice', 'Bob'], summaryLanguage: 'de',
  });
  assert.ok(p.startsWith(SUMMARY_PROMPT));
  assert.match(p, /Write the entire summary in German\./);
  assert.match(p, /Meeting: general on 2026-07-27/);
  assert.match(p, /Attendees: Alice, Bob/);
  assert.match(p, /Transcript:\nT-BODY/);
  assert.doesNotMatch(p, /Server-provided context/);
});

test('buildSummaryPrompt appends custom context only when set', () => {
  const p = buildSummaryPrompt('t', { attendees: [], customContext: 'Bosun is our render farm.' });
  assert.match(p, /Server-provided context[\s\S]*Bosun is our render farm\./);
  for (const empty of [undefined, null, '', '   ']) {
    assert.doesNotMatch(
      buildSummaryPrompt('t', { attendees: [], customContext: empty }),
      /Server-provided context/,
    );
  }
});

test('FakeSummarizer returns a valid normalized shape', async () => {
  const out = await new FakeSummarizer().summarize('transcript', { attendees: ['Alice'] });
  assert.equal(typeof out.tldr, 'string');
  assert.ok(Array.isArray(out.actionItems));
});

test('parseGeminiNotes extracts JSON from a fenced code block', () => {
  const raw = 'Here:\n```json\n{"tldr":"hi","actionItems":[{"assignee":"Alice","task":"ship"}]}\n```';
  const n = parseGeminiNotes(raw);
  assert.equal(n.tldr, 'hi');
  assert.equal(n.actionItems[0].assignee, 'Alice');
});

test('parseGeminiNotes falls back to tldr on non-JSON', () => {
  const n = parseGeminiNotes('plain text summary');
  assert.equal(n.tldr, 'plain text summary');
});

test('getSummarizer returns fake when provider is fake', () => {
  const s = getSummarizer({ summarizerProvider: 'fake', summarizerModel: 'x' });
  assert.equal(s.constructor.name, 'FakeSummarizer');
});

test('getSummarizer throws on unknown provider', () => {
  assert.throws(() => getSummarizer({ summarizerProvider: 'nope' }), /Unknown summarizer/);
});
