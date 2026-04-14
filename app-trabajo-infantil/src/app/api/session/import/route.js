import { NextResponse } from "next/server";
import { restoreSessionBundleFromZip } from "@/lib/session/session-bundle-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Debes seleccionar un archivo ZIP valido." }, { status: 400 });
    }

    const fileName = String(file.name || "").toLowerCase();
    if (!fileName.endsWith(".zip")) {
      return NextResponse.json({ error: "El archivo debe tener extension .zip." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await restoreSessionBundleFromZip(buffer);

    return NextResponse.json({
      ok: true,
      ...result,
      message: "Sesion restaurada correctamente desde ZIP.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No fue posible restaurar la sesion desde el ZIP." },
      { status: 422 }
    );
  }
}

