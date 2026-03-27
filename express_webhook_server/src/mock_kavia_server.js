'use strict';

const express = require('express');

const app = express();
app.use(express.json());

/**
 * Mock Kavia endpoint:
 * POST /analyze
 * Returns a deterministic triage response.
 */
app.post('/analyze', (req, res) => {
  const { issueKey, summary, description } = req.body || {};
  const text = `${summary || ''}\n${description || ''}`.toLowerCase();

  const labels = [];
  let confidence = 0.66;
  let recommendation = 'Needs human review.';

  if (text.includes('outage') || text.includes('sev1')) {
    labels.push('severity:high');
    confidence = 0.9;
    recommendation = 'Escalate immediately to on-call.';
  } else if (text.includes('bug') || text.includes('error')) {
    labels.push('type:bug');
    confidence = 0.78;
    recommendation = 'Route to engineering triage queue.';
  }

  return res.json({
    triageComment: `MockKavia: ${recommendation}`,
    confidence,
    labels,
  });
});

const PORT = process.env.MOCK_KAVIA_PORT || 4010;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock Kavia server listening on http://0.0.0.0:${PORT}`);
});
