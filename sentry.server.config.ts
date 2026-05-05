// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3b1865093aa672ee43e699666625d1cc@o4511335962116096.ingest.de.sentry.io/4511335972929616",

  // Performance monitoring: 10% of transactions sampled
  // Adjust higher (e.g., 0.2) if you need more performance data, lower if quota runs out
  tracesSampleRate: 0.1,

  // GDPR: do not send IP addresses or other PII automatically
  // JahtiPro handles personal data of Finnish hunting club members
  sendDefaultPii: false,

  // Distinguish dev/staging/production errors in Sentry dashboard
  environment: process.env.NODE_ENV,

  // Filter out potentially sensitive data before sending to Sentry
  beforeSend(event) {
    // Remove cookies (may contain session tokens)
    if (event.request) {
      delete event.request.cookies;
      // Remove request body (may contain form data, passwords, personal info)
      delete event.request.data;
    }

    // Remove user email and IP if Sentry collected them despite sendDefaultPii: false
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  // Reduce console noise during development
  debug: false,
});