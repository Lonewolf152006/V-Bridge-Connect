import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("error") === "true") {
    const testError = new Error("Sentry Verification Test Error from VBridgeConnect API");
    Sentry.captureException(testError);
    throw testError;
  }

  Sentry.captureMessage("Sentry Test Verification Message from VBridgeConnect API");
  return NextResponse.json({
    status: "ok",
    message: "Sentry test event recorded successfully.",
    timestamp: new Date().toISOString(),
  });
}

