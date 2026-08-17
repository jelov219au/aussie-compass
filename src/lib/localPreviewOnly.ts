import { notFound } from "next/navigation";

/**
 * Unreleased paid workspaces remain testable with `npm run dev`, but direct
 * requests are hidden on every deployed build until paid access is enforced.
 */
export function requireLocalProductPreviewAccess() {
  if (process.env.NODE_ENV === "production") notFound();
}
