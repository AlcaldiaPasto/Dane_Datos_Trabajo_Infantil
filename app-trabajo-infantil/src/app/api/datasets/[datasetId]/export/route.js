import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ error: "La exportacion se implementara en el Paso 10." }, { status: 501 }); }
