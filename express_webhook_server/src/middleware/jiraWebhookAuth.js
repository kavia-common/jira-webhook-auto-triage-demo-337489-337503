'use strict';

const { loadConfig } = require('../config');
const { verifyHmacSha256Hex } = require('../utils/webhookAuth');
const { createLogger } = require('../utils/logger');

/**
 * Middleware: validate Jira webhook signature (when JIRA_WEBHOOK_SECRET is set).
 *
 * Contract:
 * - Inputs: req.rawBody (Buffer) must exist (set by express.json verify option)
 * - Behavior:
 *   - If JIRA_WEBHOOK_SECRET unset: allow request, log warning
 *   - If set: require header 'x-jira-webhook-signature' to match HMAC SHA256 hex
 * - Output: calls next() or returns 401
 */

// PUBLIC_INTERFACE
function jiraWebhookAuth(req, res, next) {
  /** This is a public function. */
  const config = loadConfig();
  const logger = createLogger({ middleware: 'jiraWebhookAuth' });

  if (!config.jiraWebhookSecret) {
    logger.warn('webhook.secret_not_set.signature_verification_skipped');
    return next();
  }

  const sig = req.get('x-jira-webhook-signature');
  const raw = req.rawBody;

  if (!raw) {
    logger.error('missing_raw_body');
    return res.status(400).json({ status: 'error', message: 'Missing raw body for signature verification.' });
  }

  const ok = verifyHmacSha256Hex(raw, config.jiraWebhookSecret, sig);
  if (!ok) {
    logger.warn('signature_verification_failed');
    return res.status(401).json({ status: 'error', message: 'Invalid webhook signature.' });
  }

  return next();
}

module.exports = { jiraWebhookAuth };
