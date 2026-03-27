const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jira Webhook Auto-Triage Demo API',
      version: '1.0.0',
      description: 'Express server that receives Jira webhooks, runs auto-triage (Kavia AI or deterministic mock), and posts results back to Jira as a comment.',
    }
  ,
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Webhooks', description: 'Inbound webhook endpoints (e.g., Jira issue created)' },
      { name: 'Triage', description: 'Triage orchestration endpoints' },
      { name: 'Assistant', description: 'Optional SSE streaming endpoint for future interactive assistant demo' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
