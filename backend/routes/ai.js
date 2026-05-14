const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

async function callAI(userPrompt, systemPrompt = '') {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'CompanyBrain'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

function aiUnavailable() {
  return !process.env.OPENROUTER_API_KEY;
}

router.post('/extract-knowledge', verifyToken, async (req, res) => {
  try {
    const { content, source_type } = req.body;
    const result = await callAI(
      `Extract structured knowledge entries from this ${source_type} content:\n\n${content}`,
      'You are a knowledge extraction specialist. Extract key knowledge entries, procedures, policies, and decisions from the provided content. Format as structured bullet points with title, category (procedure/policy/decision/contact/process/guideline), and key details.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/answer-query', verifyToken, async (req, res) => {
  try {
    const { question, relevant_entries } = req.body;
    const context = relevant_entries ? `\n\nRelevant knowledge entries:\n${relevant_entries}` : '';
    const result = await callAI(
      `Answer this question using company knowledge:\n\nQuestion: ${question}${context}`,
      'You are a company knowledge assistant. Answer questions accurately based on the provided knowledge entries. Be concise, specific, and cite which knowledge entries you used.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate-procedure', verifyToken, async (req, res) => {
  try {
    const { process_name, department, context } = req.body;
    const result = await callAI(
      `Generate a detailed step-by-step procedure for: ${process_name}\nDepartment: ${department}\nContext: ${context || 'Standard business process'}`,
      'You are a business process expert. Generate clear, actionable step-by-step procedures with numbered steps, responsible parties, expected outcomes, and any important notes or exceptions.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/knowledge-gaps', verifyToken, async (req, res) => {
  try {
    const { department } = req.body;
    const result = await callAI(
      `Identify knowledge gaps in the ${department} department of a typical company.`,
      'You are a knowledge management consultant. Identify common knowledge gaps, undocumented processes, tribal knowledge risks, and areas where documentation is typically missing. Provide specific recommendations for filling these gaps.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summarize a document or arbitrary text
router.post('/summarize-document', verifyToken, async (req, res) => {
  try {
    if (aiUnavailable()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const result = await callAI(
      `Summarize the following document${title ? ` titled "${title}"` : ''}:\n\n${content}`,
      'You are a document summarization expert. Produce a clear, structured summary with: (1) a 2-3 sentence executive overview, (2) 3-7 key bullet points, and (3) any action items or open questions. Keep it concise and faithful to the source.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find semantically similar documents/entries
router.post('/find-similar', verifyToken, async (req, res) => {
  try {
    if (aiUnavailable()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { reference, candidates } = req.body;
    if (!reference) return res.status(400).json({ error: 'reference text is required' });
    const candList = Array.isArray(candidates) ? candidates : [];
    const candText = candList.length
      ? candList.map((c, i) => `[${i + 1}] ${c.title || 'Untitled'}: ${(c.content || '').slice(0, 400)}`).join('\n\n')
      : '(no candidates provided — use general reasoning)';
    const result = await callAI(
      `Reference document:\n${reference}\n\nCandidate documents:\n${candText}\n\nRank the candidates from most-similar to least-similar to the reference, with a similarity score 0-100 and a one-line reason for each.`,
      'You are a semantic similarity expert. Output a ranked list, with index, title, score, and reason for each candidate.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extract named entities (people, orgs, dates, products, locations) from a doc
router.post('/extract-entities', verifyToken, async (req, res) => {
  try {
    if (aiUnavailable()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const result = await callAI(
      `Extract all named entities from this text:\n\n${content}`,
      'You are a named-entity-recognition specialist. Extract entities and group them by type: People, Organizations, Locations, Dates, Products, Systems, Metrics. Output each group as a labeled bullet list. If a category is empty, omit it.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-tag a document with relevant tags / categories
router.post('/auto-tag', verifyToken, async (req, res) => {
  try {
    if (aiUnavailable()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const result = await callAI(
      `Suggest tags and a primary category for this document${title ? ` titled "${title}"` : ''}:\n\n${content}`,
      'You are an auto-tagging system for a company knowledge base. Output: (1) Primary category (procedure/policy/decision/contact/process/guideline), (2) 5-10 lowercase, hyphenated tags (comma-separated), (3) Suggested department, (4) One-sentence rationale.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rank docs by knowledge-staleness (how out-of-date they are likely to be)
router.post('/staleness-rank', verifyToken, async (req, res) => {
  try {
    if (aiUnavailable()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { documents } = req.body;
    const docs = Array.isArray(documents) ? documents : [];
    if (docs.length === 0) return res.status(400).json({ error: 'documents array is required' });
    const docText = docs.map((d, i) =>
      `[${i + 1}] Title: ${d.title || 'Untitled'} | Last updated: ${d.last_updated || 'unknown'} | Status: ${d.status || 'n/a'} | Excerpt: ${(d.content || '').slice(0, 300)}`
    ).join('\n\n');
    const result = await callAI(
      `Rank these company knowledge documents by how stale / out-of-date they appear to be:\n\n${docText}`,
      'You are a knowledge-staleness analyst. Consider last-updated date, signals of obsolete tooling or terminology, broken-looking references, and whether the topic typically changes quickly. Output a ranked list (most-stale first) with: index, title, staleness score 0-100, and a one-line reason. End with 2-3 prioritized refresh recommendations.'
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
