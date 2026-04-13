import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST() { return NextResponse.json({ error: "El reprocesamiento se implementara en el Paso 5." }, { status: 501 }); }
