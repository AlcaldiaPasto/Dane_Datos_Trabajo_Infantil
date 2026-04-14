import { NextResponse } from "next/server";
import { buildSessionBundleZip } from "@/lib/session/session-bundle-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await buildSessionBundleZip();

  return new NextResponse(result.zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

