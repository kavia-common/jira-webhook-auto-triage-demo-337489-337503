'use strict';

const { createLogger } = require('../utils/logger');
const { JiraClient } = require('../adapters/jiraClient');
const { AiProvider } = require('../adapters/aiProvider');

/**
 * AutoTriageFlow
 *
 * Contract:
 * - Inputs:
 *   - request: { issueKey: string, summary?: string, description?: string, dryRun?: boolean }
 *   - config: loaded config from src/config.js
 * - Outputs:
 *   - result: { issueKey, dryRun, triage: { triageComment, confidence, labels }, jiraCommentPosted: boolean }
 * - Errors:
 *   - throws Error with context; API layer maps to HTTP 4xx/5xx
 * - Side effects:
 *   - when dryRun=false: posts a comment to Jira issue via Jira REST API
 */

// PUBLIC_INTERFACE
async function runAutoTriageFlow(request, config) {
  /** This is a public function. */
  const logger = createLogger({ flow: 'AutoTriageFlow', issueKey: request.issueKey });

  if (!request.issueKey) {
    throw new Error('issueKey is required.');
  }

  const dryRun = Boolean(request.dryRun);
  logger.info('flow.start', { dryRun });

  const ai = new AiProvider(config, logger);
  const jira = new JiraClient(config, logger);

  // Step 1: AI analysis
  logger.info('flow.step.ai_analyze.start');
  const triage = await ai.analyzeIssue({
    issueKey: request.issueKey,
    summary: request.summary,
    description: request.description,
  });
  logger.info('flow.step.ai_analyze.done', {
    confidence: triage.confidence,
    labels: triage.labels,
  });

  // Step 2: Post comment
  let jiraCommentPosted = false;
  if (!dryRun) {
    logger.info('flow.step.jira_comment.start');
    const commentBody = `${config.triageCommentPrefix}\n\n${triage.triageComment}`;
    await jira.addComment(request.issueKey, commentBody);
    jiraCommentPosted = true;
    logger.info('flow.step.jira_comment.done');
  } else {
    logger.warn('flow.step.jira_comment.skipped', { reason: 'dryRun=true' });
  }

  const result = {
    issueKey: request.issueKey,
    dryRun,
    triage,
    jiraCommentPosted,
  };

  logger.info('flow.success', { jiraCommentPosted });
  return result;
}

module.exports = { runAutoTriageFlow };
