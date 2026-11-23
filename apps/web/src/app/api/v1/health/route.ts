import { NextResponse } from "next/server";
import { getEnvDiagnostics } from "@/lib/env";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 * Runtime readiness endpoint verifying PostgreSQL connectivity and safe capability flags.
 */
export async function GET() {
  const diagnostics = getEnvDiagnostics();
  const timestamp = new Date().toISOString();

  if (!diagnostics.databaseConfigured) {
    return NextResponse.json(
      {
        ok: true,
        status: "degraded",
        database: "unconfigured",
        ...diagnostics,
        timestamp,
      },
      { status: 200 }
    );
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    return NextResponse.json(
      {
        ok: false,
        status: "misconfigured",
        database: "invalid_url",
        error: "DATABASE_URL must start with postgresql:// or postgres://",
        ...diagnostics,
        timestamp,
      },
      { status: 503 }
    );
  }

  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        status: "healthy",
        database: "connected",
        latencyMs: Date.now() - startedAt,
        ...diagnostics,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("health.database.error", {
      route: "/api/v1/health",
      error: error?.message || String(error),
    });
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        database: "error",
        ...diagnostics,
        timestamp,
      },
      { status: 503 }
    );
  }
}
