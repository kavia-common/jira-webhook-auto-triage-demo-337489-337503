'use strict';

/**
 * Very small structured logger wrapper.
 * Keeps logs consistent without adding a heavy logging dependency.
 */

// PUBLIC_INTERFACE
function createLogger(context) {
  /** This is a public function. */
  const base = { ...context };

  function fmt(level, msg, extra) {
    const payload = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...base,
      ...(extra || {}),
    };
    return JSON.stringify(payload);
  }

  return {
    info: (msg, extra) => console.log(fmt('info', msg, extra)),
    warn: (msg, extra) => console.warn(fmt('warn', msg, extra)),
    error: (msg, extra) => console.error(fmt('error', msg, extra)),
  };
}

module.exports = { createLogger };
