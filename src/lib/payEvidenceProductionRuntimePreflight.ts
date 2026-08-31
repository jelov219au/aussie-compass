export type PayEvidenceRuntimeReadiness = {
  enabled: boolean;
  stripeConfigured: boolean;
  stripeProductContractConfigured: boolean;
  managedPaymentsConfigured: boolean;
  webhookConfigured: boolean;
  entitlementStoreConfigured: boolean;
  firstSaleGateConfigured: boolean;
  accessDeliveryImplemented: boolean;
  sellerDetailsConfigured: boolean;
  supportConfigured: boolean;
  operatorAlertsConfigured: boolean;
  firstSaleMonitoredModeConfigured: boolean;
  productEnabled: boolean;
  productPriceConfigured: boolean;
  ready: boolean;
};

export type PayEvidenceProductionRuntimePreflightInput = {
  environment: string | undefined;
  sharedPaymentsEnabled: string | undefined;
  payEvidencePaymentsEnabled: string | undefined;
  managedPaymentsEnabled: string | undefined;
  deploymentSha: string | undefined;
  expectedSha: string;
  runtimeKeyRolesDistinct: boolean;
  readiness: PayEvidenceRuntimeReadiness;
};

export type PayEvidenceProductionRuntimePreflightDependencies = {
  verifyPayEvidenceStripeProductAndOpenSessions: () => Promise<boolean>;
  verifyRuntimeSchema: () => Promise<boolean>;
  verifyRuntimeDatabaseRoleAndEndpoint: () => Promise<boolean>;
  verifyPaymentAlertTransportWithoutSending: () => Promise<boolean>;
};

const exactShaPattern = /^[a-f0-9]{40}$/;

function configurationReady(input: PayEvidenceProductionRuntimePreflightInput) {
  const readiness = input.readiness;

  return input.environment === "production"
    && input.sharedPaymentsEnabled === "true"
    && input.payEvidencePaymentsEnabled === "false"
    && input.managedPaymentsEnabled === "true"
    && exactShaPattern.test(input.expectedSha)
    && input.deploymentSha === input.expectedSha
    && input.runtimeKeyRolesDistinct
    && readiness.enabled === false
    && readiness.ready === false
    && readiness.productEnabled === false
    && readiness.productPriceConfigured
    && readiness.stripeConfigured
    && readiness.stripeProductContractConfigured
    && readiness.managedPaymentsConfigured
    && readiness.webhookConfigured
    && readiness.entitlementStoreConfigured
    && readiness.firstSaleGateConfigured
    && readiness.accessDeliveryImplemented
    && readiness.sellerDetailsConfigured
    && readiness.supportConfigured
    && (readiness.operatorAlertsConfigured || readiness.firstSaleMonitoredModeConfigured);
}

export async function runPayEvidenceProductionRuntimePreflight(
  input: PayEvidenceProductionRuntimePreflightInput,
  dependencies: PayEvidenceProductionRuntimePreflightDependencies,
) {
  if (!configurationReady(input)) return false;

  try {
    const [stripeReady, schemaReady, runtimeDatabaseReady, operatorMonitoringReady] = await Promise.all([
      dependencies.verifyPayEvidenceStripeProductAndOpenSessions(),
      dependencies.verifyRuntimeSchema(),
      dependencies.verifyRuntimeDatabaseRoleAndEndpoint(),
      input.readiness.firstSaleMonitoredModeConfigured
        ? Promise.resolve(true)
        : dependencies.verifyPaymentAlertTransportWithoutSending(),
    ]);

    return stripeReady && schemaReady && runtimeDatabaseReady && operatorMonitoringReady;
  } catch {
    return false;
  }
}
