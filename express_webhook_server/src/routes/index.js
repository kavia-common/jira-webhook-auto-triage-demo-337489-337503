'use strict';

const express = require('express');
const healthController = require('../controllers/health');
const triageController = require('../controllers/triage');
const { jiraWebhookAuth } = require('../middleware/jiraWebhookAuth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *   - name: Webhooks
 *   - name: Triage
 *   - name: Assistant
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /webhooks/jira/issue-created:
 *   post:
 *     tags: [Webhooks]
 *     summary: Jira webhook for issue created
 *     description: Receives a Jira issue-created webhook payload, runs auto-triage, and posts a comment back to the issue.
 *     parameters:
 *       - in: header
 *         name: x-jira-webhook-signature
 *         schema:
 *           type: string
 *         required: false
 *         description: HMAC SHA256 hex signature of the raw request body. Required when JIRA_WEBHOOK_SECRET is set.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Jira webhook payload (subset used by this demo)
 *     responses:
 *       200:
 *         description: Triage executed successfully
 *       401:
 *         description: Invalid webhook signature
 */
router.post(
  '/webhooks/jira/issue-created',
  jiraWebhookAuth,
  triageController.jiraIssueCreated.bind(triageController)
);

/**
 * @swagger
 * /triage/auto:
 *   post:
 *     tags: [Triage]
 *     summary: Trigger auto-triage for a Jira issue (manual/dev)
 *     description: Runs auto-triage and optionally posts a Jira comment. Useful for local testing without webhooks.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issueKey]
 *             properties:
 *               issueKey:
 *                 type: string
 *                 example: DEMO-123
 *               summary:
 *                 type: string
 *                 example: "Bug: login error on mobile"
 *               description:
 *                 type: string
 *                 example: "Steps to reproduce... stack trace..."
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *                 description: When true, does not post comment to Jira.
 *     responses:
 *       200:
 *         description: Triage executed successfully
 */
router.post('/triage/auto', triageController.auto.bind(triageController));

/**
 * @swagger
 * /assistant/stream:
 *   get:
 *     tags: [Assistant]
 *     summary: Optional SSE stream endpoint
 *     description: Server-Sent Events endpoint for future interactive assistant demo. Currently emits a hello event and periodic ticks.
 *     responses:
 *       200:
 *         description: SSE stream established
 */
router.get('/assistant/stream', triageController.stream.bind(triageController));

module.exports = router;
