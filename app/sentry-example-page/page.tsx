"use client";

import * as Sentry from "@sentry/nextjs";
import Head from "next/head";
import { useEffect, useState } from "react";

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export default function Page() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== "sentry-unreachable");
    }
    checkConnectivity();
  }, []);

  return (
    <div>
      <Head>
        <title>sentry-example-page</title>
        <meta name="description" content="Test Sentry for your Next.js app!" />
      </Head>

      <main
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
          padding: "16px",
        }}
      >
        <h1>Sentry Example Page</h1>
        <p>
          Click the button below to throw a test error and verify it appears in{" "}
          <a
            target="_blank"
            rel="noopener"
            href="https://jahtipro.sentry.io/issues/?project=4511335972929616"
          >
            Sentry Issues
          </a>
          .
        </p>

        <button
          type="button"
          onClick={async () => {
            await Sentry.startSpan(
              { name: "Example Frontend/Backend Span", op: "test" },
              async () => {
                const res = await fetch("/api/sentry-example-api");
                if (!res.ok) {
                  setHasSentError(true);
                }
              },
            );
            throw new SentryExampleFrontendError(
              "This error is raised on the frontend of the example page.",
            );
          }}
          disabled={!isConnected}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#7553FF",
            color: "white",
            cursor: "pointer",
          }}
        >
          Throw Sample Error
        </button>

        {hasSentError && <p style={{ color: "green" }}>Error sent to Sentry.</p>}
        {!isConnected && (
          <p style={{ color: "red" }}>
            Network requests to Sentry are being blocked. Try disabling your ad-blocker.
          </p>
        )}
      </main>
    </div>
  );
}
