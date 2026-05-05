import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

export function GET() {
  throw new SentryExampleAPIError(
    "This error is raised on the server of the example page.",
  );
  return NextResponse.json({ data: "Testing Sentry Error..." });
}
