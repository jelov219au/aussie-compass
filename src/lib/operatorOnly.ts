import { notFound } from "next/navigation";

/**
 * Operator workspaces stay available during local development, but are not
 * exposed on preview or production deployments until real admin auth exists.
 */
export function requireLocalOperatorAccess() {
  if (process.env.NODE_ENV === "production") notFound();
}
