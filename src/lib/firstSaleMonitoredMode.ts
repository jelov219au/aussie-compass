export const firstSaleMonitoredModeOwnerAck = "SINGLE_FIRST_SALE_MANUAL_MONITORING_APPROVED";

export const firstSaleManualMonitoringTarget = "stripe_dashboard_and_runtime_logs";

export function getFirstSaleMonitoredModeStatus() {
  const requested = process.env.FIRST_SALE_MONITORED_MODE_ENABLED?.trim().toLowerCase() === "true";
  const ownerAcknowledged = process.env.FIRST_SALE_MONITORED_MODE_OWNER_ACK?.trim()
    === firstSaleMonitoredModeOwnerAck;
  const production = process.env.VERCEL_ENV === "production";
  const firstSaleGateEnabled = process.env.FIRST_SALE_GATE_ENABLED === "true";
  const durableStoreConfigured = process.env.PAYMENTS_ENTITLEMENT_STORE === "neon";

  return {
    requested,
    ownerAcknowledged,
    production,
    firstSaleGateEnabled,
    durableStoreConfigured,
    configured: requested
      && ownerAcknowledged
      && production
      && firstSaleGateEnabled
      && durableStoreConfigured,
  };
}

export function isFirstSaleMonitoredModeConfigured() {
  return getFirstSaleMonitoredModeStatus().configured;
}
