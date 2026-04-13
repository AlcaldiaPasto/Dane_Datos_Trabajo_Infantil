import { NextResponse } from "next/server";
import { getCurrentProcesses } from "@/lib/processes/process-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const processes = await getCurrentProcesses();
  return NextResponse.json({ processes });
}
