#!/bin/bash
cd /home/kavia/workspace/code-generation/jira-webhook-auto-triage-demo-337489-337503/express_webhook_server
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

