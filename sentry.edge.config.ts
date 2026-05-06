// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3b1865093aa672ee43e699666625d1cc@o4511335962116096.ingest.de.sentry.io/4511335972929616",

  // Performance monitoring: 10% of transactions sampled
  tracesSampleRate: 0.1,

  // GDPR: do not send IP addresses or other PII automatically
  sendDefaultPii: false,

  // Distinguish dev/staging/production errors
  environment: process.env.NODE_ENV,

  // Reduce console noise during development
  debug: false,
});