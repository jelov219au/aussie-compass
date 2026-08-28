import "server-only";

import type { FirstCustomerLaunchDecision } from "./firstCustomerLaunchPolicy";
import { getFirstCustomerPrePaymentBlockers } from "./firstCustomerLaunchGates";

export type { FirstCustomerLaunchDecision } from "./firstCustomerLaunchPolicy";

export const firstCustomerLaunchDecision = {
  status: "no_go",
  auditedAt: "2026-08-28",
  approvedAt: null,
  validUntil: null,
  blockers: getFirstCustomerPrePaymentBlockers(),
} satisfies FirstCustomerLaunchDecision;
