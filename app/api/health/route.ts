import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthPayload {
  status: "ok" | "degraded";
  db: "ok" | "error";
  dbMessage: string | null;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthPayload>> {
  let dbStatus: "ok" | "error" = "ok";
  let dbMessage: string | null = null;
  let timestamp = new Date().toISOString();

  try {
    const result = await query<{ now: string }>("SELECT NOW() AS now");
    timestamp = result.rows[0].now;
  } catch (err) {
    dbStatus = "error";
    dbMessage = err instanceof Error ? err.message : String(err);
  }

  const overallStatus: "ok" | "degraded" =
    dbStatus === "ok" ? "ok" : "degraded";

  const httpStatus = overallStatus === "ok" ? 200 : 503;

  return NextResponse.json(
    { status: overallStatus, db: dbStatus, dbMessage, timestamp },
    { status: httpStatus }
  );
}
