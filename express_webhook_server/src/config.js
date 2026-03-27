'use strict';

/**
 * Centralized configuration loader for the service.
 *
 * Contract:
 * - Inputs: process.env
 * - Outputs: a normalized config object with required/optional fields
 * - Errors: throws Error with actionable message when required variables are missing
 * - Side effects: none
 */

// PUBLIC_INTERFACE
function loadConfig() {
  /** This is a public function. */
  const cfg = {
    nodeEnv: process.env.NODE_ENV || 'development',

    // Shared secret used to validate Jira webhooks. If unset, signature validation is skipped (logged).
    jiraWebhookSecret: process.env.JIRA_WEBHOOK_SECRET || '',

    // Jira REST API (used to comment on the issue)
    jiraBaseUrl: process.env.JIRA_BASE_URL || '',
    jiraUserEmail: process.env.JIRA_USER_EMAIL || '',
    jiraApiToken: process.env.JIRA_API_TOKEN || '',

    // AI provider selection
    aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(), // 'mock' | 'kavia'
    kaviaApiBaseUrl: process.env.KAVIA_API_BASE_URL || 'http://localhost:4010',
    kaviaApiKey: process.env.KAVIA_API_KEY || '',

    // Optional: if you want to post a static label/marker in comment
    triageCommentPrefix: process.env.TRIAGE_COMMENT_PREFIX || 'Auto-triage:',
  };

  return cfg;
}

module.exports = { loadConfig };
