# Jira webhook auto-triage demo (Express)

Minimal demo app that:
1) receives a Jira “issue created” webhook  
2) runs a simple auto-triage decision (deterministic mock or a real “Kavia-like” HTTP endpoint)  
3) posts a comment back to the Jira issue using Jira REST API.

## What’s included

- Express API server:
  - `POST /webhooks/jira/issue-created` (Jira webhook receiver)
  - `POST /triage/auto` (manual triage trigger for local dev)
  - `GET /assistant/stream` (optional SSE stream endpoint, emits ticks)
  - `GET /docs` (Swagger UI)
- Deterministic AI mock (built in via `AI_PROVIDER=mock`)
- Optional “Kavia” HTTP adapter:
  - `AI_PROVIDER=kavia` calls `POST {KAVIA_API_BASE_URL}/analyze`
  - A **local mock Kavia server** is included at `express_webhook_server/src/mock_kavia_server.js`

---

## Prerequisites

- Node.js 18+
- A Jira Cloud site (e.g. `https://your-domain.atlassian.net`)
- A Jira user (service account recommended) with an **API token**
- `ngrok` for webhook testing from Jira -> your laptop

---

## Setup

### 1) Install dependencies

```bash
cd jira-webhook-auto-triage-demo-337489-337503/express_webhook_server
npm install
```

### 2) Create a `.env` file (in `express_webhook_server/`)

Create `express_webhook_server/.env` with:

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Webhook shared secret (optional but recommended)
# If set, requests must include header x-jira-webhook-signature = HMAC_SHA256_HEX(raw_body, secret)
JIRA_WEBHOOK_SECRET=replace-me

# Jira REST API (used to post comments)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=service-account@your-domain.com
JIRA_API_TOKEN=your-jira-api-token

# AI provider selection: mock | kavia
AI_PROVIDER=mock

# If AI_PROVIDER=kavia, set base URL (a local mock is available)
KAVIA_API_BASE_URL=http://localhost:4010
KAVIA_API_KEY=

TRIAGE_COMMENT_PREFIX=Auto-triage:
```

### 3) Run the Express server

```bash
npm run dev
```

Open:
- Swagger UI: `http://localhost:3001/docs`
- Health: `http://localhost:3001/`

### 4) (Optional) Run the mock Kavia server

If you want to demo `AI_PROVIDER=kavia` without a real Kavia service:

```bash
node src/mock_kavia_server.js
```

Then set in `.env`:

```bash
AI_PROVIDER=kavia
KAVIA_API_BASE_URL=http://localhost:4010
```

---

## Local testing (no Jira webhook yet)

### Manual triage (dry-run)

```bash
curl -sS http://localhost:3001/triage/auto \
  -H "Content-Type: application/json" \
  -d '{
    "issueKey":"DEMO-123",
    "summary":"Bug: login error on mobile",
    "description":"User reports error stack trace...",
    "dryRun": true
  }' | jq
```

### Manual triage (posts a real Jira comment)

Set real Jira env vars first (see `.env`), then:

```bash
curl -sS http://localhost:3001/triage/auto \
  -H "Content-Type: application/json" \
  -d '{
    "issueKey":"YOURPROJECT-1",
    "summary":"Urgent outage",
    "description":"sev1 outage affecting users",
    "dryRun": false
  }' | jq
```

---

## Jira webhook testing with ngrok

### 1) Start ngrok

```bash
ngrok http 3001
```

Copy the HTTPS forwarding URL, for example:

`https://abc123.ngrok-free.app`

### 2) Create a Jira webhook (admin UI)

In Jira Cloud:
- Go to **Jira settings → System → Webhooks → Create a webhook**
- URL:
  - `https://abc123.ngrok-free.app/webhooks/jira/issue-created`
- Events:
  - **Issue → created**
- (Optional) Restrict to JQL like: `project = YOURPROJECT`

### 3) Configure webhook authentication (shared secret)

This demo supports an HMAC signature header:

- Header name: `x-jira-webhook-signature`
- Value: `HMAC_SHA256_HEX(raw_request_body, JIRA_WEBHOOK_SECRET)`

Important:
- Jira’s built-in webhook UI does not always provide a “sign the payload” option.
- If you can’t configure Jira to send this header, set `JIRA_WEBHOOK_SECRET` to empty to skip verification (not recommended for real use).

### 4) Trigger the webhook

Create a new issue in the configured Jira project.  
The server should receive the webhook, run triage, and post a comment to the issue.

---

## Notes / Troubleshooting

- If Jira comment posting fails:
  - verify `JIRA_BASE_URL` is your site root (e.g. `https://your-domain.atlassian.net`)
  - verify `JIRA_USER_EMAIL` + `JIRA_API_TOKEN`
  - ensure the user has permission to comment in that project
- If you enable `JIRA_WEBHOOK_SECRET` but don’t send the signature header, requests will be rejected with `401`.

---

## API docs

Swagger UI: `GET /docs`

Endpoints:
- `POST /webhooks/jira/issue-created`
- `POST /triage/auto`
- `GET /assistant/stream`

Task completed: Implemented Jira webhook + auto-triage endpoints, Jira comment integration, optional SSE stream endpoint, Swagger docs updates, and step-by-step README for local + ngrok workflow.
