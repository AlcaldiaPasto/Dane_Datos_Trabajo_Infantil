export function formatDateTime(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no valida";
  }

  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
