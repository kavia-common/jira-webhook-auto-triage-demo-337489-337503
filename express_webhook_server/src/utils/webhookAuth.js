'use strict';

const crypto = require('crypto');

/**
 * Compute and verify HMAC signatures.
 *
 * Expected header:
 * - x-jira-webhook-signature: hex HMAC SHA256 of raw request body
 *
 * Contract:
 * - Inputs: rawBody (Buffer), secret (string), signatureHeaderValue (string)
 * - Outputs: boolean
 * - Errors: none (returns false on any mismatch)
 */

// PUBLIC_INTERFACE
function verifyHmacSha256Hex(rawBody, secret, signatureHeaderValue) {
  /** This is a public function. */
  if (!secret) return true; // caller decides whether secret is required
  if (!signatureHeaderValue) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    // Use timingSafeEqual to prevent timing attacks.
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signatureHeaderValue, 'utf8')
    );
  } catch {
    return false;
  }
}

module.exports = { verifyHmacSha256Hex };
