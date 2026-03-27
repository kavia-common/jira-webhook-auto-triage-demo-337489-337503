'use strict';

const axios = require('axios');

/**
 * Jira REST API adapter.
 *
 * Contract:
 * - Inputs: config { jiraBaseUrl, jiraUserEmail, jiraApiToken }
 * - Side effects: network calls to Jira
 * - Errors: throws Error with context; caller should map to HTTP error response
 */

function buildAuthHeader(email, apiToken) {
  const token = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return `Basic ${token}`;
}

class JiraClient {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;

    this.http = axios.create({
      baseURL: config.jiraBaseUrl,
      timeout: 15000,
      headers: {
        Authorization: buildAuthHeader(config.jiraUserEmail, config.jiraApiToken),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  // PUBLIC_INTERFACE
  async addComment(issueKey, bodyText) {
    /** This is a public function. */
    if (!this.config.jiraBaseUrl) {
      throw new Error('JIRA_BASE_URL is required to add comments.');
    }
    if (!this.config.jiraUserEmail || !this.config.jiraApiToken) {
      throw new Error('JIRA_USER_EMAIL and JIRA_API_TOKEN are required to add comments.');
    }
    if (!issueKey) {
      throw new Error('issueKey is required.');
    }

    const url = `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`;

    // Jira Cloud supports either Atlassian Document Format or plain string in some contexts.
    // We use a simple plain text comment via "body" string (works in most Jira Cloud sites).
    // If your Jira requires ADF, adjust this adapter accordingly.
    try {
      this.logger.info('jira.addComment.start', { issueKey });
      const resp = await this.http.post(url, { body: bodyText });
      this.logger.info('jira.addComment.success', { issueKey, status: resp.status });
      return resp.data;
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      this.logger.error('jira.addComment.error', { issueKey, status, data });
      throw new Error(`Failed to add Jira comment (status=${status || 'unknown'}).`);
    }
  }
}

module.exports = { JiraClient };
