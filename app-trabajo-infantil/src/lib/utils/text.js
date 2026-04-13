export function toTitleCase(value) {
  return String(value || "").toLowerCase().split(/[_\s]+/).filter(Boolean).map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1)).join(" ");
}
