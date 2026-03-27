'use strict';

const { loadConfig } = require('../config');
const { runAutoTriageFlow } = require('../flows/autoTriageFlow');
const { createLogger } = require('../utils/logger');

function getJiraIssueFieldsFromWebhook(payload) {
  // Jira issue-created webhook typically includes payload.issue with fields.summary and fields.description.
  const issueKey = payload?.issue?.key || payload?.issue?.id || payload?.issueKey;
  const summary = payload?.issue?.fields?.summary || payload?.summary;
  const description =
    payload?.issue?.fields?.description?.content
      ? JSON.stringify(payload.issue.fields.description)
      : payload?.issue?.fields?.description || payload?.description;

  return { issueKey, summary, description };
}

class TriageController {
  /**
   * API boundary: POST /triage/auto
   */
  // PUBLIC_INTERFACE
  async auto(req, res, next) {
    /** This is a public function. */
    const config = loadConfig();
    const logger = createLogger({ route: 'POST /triage/auto' });

    try {
      const { issueKey, summary, description, dryRun } = req.body || {};
      logger.info('request.received', { issueKey, dryRun: Boolean(dryRun) });

      const result = await runAutoTriageFlow(
        { issueKey, summary, description, dryRun: Boolean(dryRun) },
        config
      );

      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      logger.error('request.error', { message: err.message });
      return next(err);
    }
  }

  /**
   * API boundary: POST /webhooks/jira/issue-created
   * Expects validated webhook auth (middleware), then runs auto triage.
   */
  // PUBLIC_INTERFACE
  async jiraIssueCreated(req, res, next) {
    /** This is a public function. */
    const config = loadConfig();
    const logger = createLogger({ route: 'POST /webhooks/jira/issue-created' });

    try {
      const { issueKey, summary, description } = getJiraIssueFieldsFromWebhook(req.body);
      logger.info('webhook.received', { issueKey });

      // Webhook-driven runs should not be dry-run by default.
      const result = await runAutoTriageFlow(
        { issueKey, summary, description, dryRun: false },
        config
      );

      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      logger.error('webhook.error', { message: err.message });
      return next(err);
    }
  }

  /**
   * API boundary: GET /assistant/stream (SSE)
   */
  // PUBLIC_INTERFACE
  async stream(req, res) {
    /** This is a public function. */
    const logger = createLogger({ route: 'GET /assistant/stream' });
    logger.info('sse.connect');

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // Immediately flush a greeting event
    res.write(`event: hello\ndata: ${JSON.stringify({ message: 'SSE connected' })}\n\n`);

    let counter = 0;
    const interval = setInterval(() => {
      counter += 1;
      res.write(`event: tick\ndata: ${JSON.stringify({ counter, ts: new Date().toISOString() })}\n\n`);
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
      logger.info('sse.disconnect');
    });
  }
}

module.exports = new TriageController();
