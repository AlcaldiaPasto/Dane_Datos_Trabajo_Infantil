"use client";

import { useEffect } from "react";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";

export default function IndexedDbBootstrap() {
  useEffect(() => {
    ensureClientBootstrap().catch((error) => {
      console.error("Error al inicializar IndexedDB y seed base 2024:", error);
    });
  }, []);

  return null;
}

