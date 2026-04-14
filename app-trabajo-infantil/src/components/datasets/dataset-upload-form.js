import Link from "next/link";
import Card from "@/components/ui/card";

export default function DatasetUploadForm() {
  return (
    <Card
      title="Ingreso de archivos"
      subtitle="El flujo real empieza subiendo un CSV, validandolo y dejandolo disponible en este panel."
      interactive
      className="bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_100%)]"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-sm leading-7 text-muted">
            Usa la pagina de carga para seleccionar el archivo, revisar nombre, tamano, Año detectado
            y ejecutar la validacion inicial antes de abrir el detalle.
          </p>
        </div>
        <Link
          href="/datasets/nuevo"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800 sm:w-auto"
        >
          Subir nuevo CSV
        </Link>
      </div>
    </Card>
  );
}
