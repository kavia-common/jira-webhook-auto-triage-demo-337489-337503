'use strict';

const axios = require('axios');

/**
 * AI provider adapter.
 *
 * Contract:
 * - Inputs: providerName ('mock' | 'kavia'), config, logger
 * - Outputs: analyzeIssue({ issueKey, summary, description }) -> { triageComment, confidence, labels }
 * - Errors: throws Error with context
 */

function deterministicMockAnalysis({ issueKey, summary, description }) {
  const text = `${summary || ''}\n${description || ''}`.toLowerCase();
  const labels = [];
  let confidence = 0.6;
  let recommendation = 'Needs human review.';

  if (text.includes('urgent') || text.includes('sev1') || text.includes('outage')) {
    labels.push('severity:high');
    confidence = 0.85;
    recommendation = 'Escalate to on-call immediately.';
  } else if (text.includes('bug') || text.includes('error') || text.includes('stack')) {
    labels.push('type:bug');
    confidence = 0.75;
    recommendation = 'Route to engineering triage queue.';
  } else if (text.includes('feature') || text.includes('request') || text.includes('enhancement')) {
    labels.push('type:feature');
    confidence = 0.7;
    recommendation = 'Route to product backlog for sizing.';
  }

  return {
    triageComment: `Issue ${issueKey}: ${recommendation}\nSuggested labels: ${labels.length ? labels.join(', ') : '(none)'}\nConfidence: ${confidence}`,
    confidence,
    labels,
  };
}

class AiProvider {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  // PUBLIC_INTERFACE
  async analyzeIssue(input) {
    /** This is a public function. */
    const provider = this.config.aiProvider;

    if (provider === 'mock') {
      this.logger.info('ai.mock.analyze', { issueKey: input.issueKey });
      return deterministicMockAnalysis(input);
    }

    if (provider !== 'kavia') {
      throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use 'mock' or 'kavia'.`);
    }

    if (!this.config.kaviaApiBaseUrl) {
      throw new Error('KAVIA_API_BASE_URL is required when AI_PROVIDER=kavia.');
    }

    // This is a minimal demo contract. If the real Kavia endpoint differs, update only this adapter.
    // Expected: POST { issueKey, summary, description } -> { triageComment, confidence, labels }
    try {
      this.logger.info('ai.kavia.analyze.start', { issueKey: input.issueKey });
      const resp = await axios.post(
        `${this.config.kaviaApiBaseUrl.replace(/\/$/, '')}/analyze`,
        input,
        {
          timeout: 20000,
          headers: this.config.kaviaApiKey
            ? { Authorization: `Bearer ${this.config.kaviaApiKey}` }
            : {},
        }
      );
      this.logger.info('ai.kavia.analyze.success', { issueKey: input.issueKey, status: resp.status });
      return resp.data;
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      this.logger.error('ai.kavia.analyze.error', { issueKey: input.issueKey, status, data });
      throw new Error(`Kavia analyze call failed (status=${status || 'unknown'}).`);
    }
  }
}

module.exports = { AiProvider };
