import { getSessionsRoot } from "@/lib/storage/file-store";

export function getDefaultSessionId() { return "session-local"; }
export function getDefaultSessionPath() { return getSessionsRoot(); }
