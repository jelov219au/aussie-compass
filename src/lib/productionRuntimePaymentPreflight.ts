export type RuntimePaymentReadiness = {
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
  ready: boolean;
};

export type ProductionRuntimePaymentPreflightInput = {
  environment: string | undefined;
  paymentsEnabled: string | undefined;
  managedPaymentsEnabled: string | undefined;
  deploymentSha: string | undefined;
  expectedSha: string;
  readiness: RuntimePaymentReadiness;
};

export type ProductionRuntimePaymentPreflightDependencies = {
  verifyStripeProductAndZeroOpenSessions: () => Promise<boolean>;
  verifyRuntimeSchema: () => Promise<boolean>;
  verifyRuntimeDatabaseRoleAndEndpoint: () => Promise<boolean>;
  verifyPaymentAlertTransportWithoutSending: () => Promise<boolean>;
};

const exactShaPattern = /^[a-f0-9]{40}$/;

function configurationReady(input: ProductionRuntimePaymentPreflightInput) {
  const readiness = input.readiness;

  return input.environment === "production"
    && input.paymentsEnabled === "false"
    && input.managedPaymentsEnabled === "true"
    && exactShaPattern.test(input.expectedSha)
    && input.deploymentSha === input.expectedSha
    && readiness.enabled === false
    && readiness.ready === false
    && readiness.stripeConfigured
    && readiness.stripeProductContractConfigured
    && readiness.managedPaymentsConfigured
    && readiness.webhookConfigured
    && readiness.entitlementStoreConfigured
    && readiness.firstSaleGateConfigured
    && readiness.accessDeliveryImplemented
    && readiness.sellerDetailsConfigured
    && readiness.supportConfigured
    && readiness.operatorAlertsConfigured;
}

export async function runProductionRuntimePaymentPreflight(
  input: ProductionRuntimePaymentPreflightInput,
  dependencies: ProductionRuntimePaymentPreflightDependencies,
) {
  if (!configurationReady(input)) return false;

  try {
    const [stripeReady, schemaReady, runtimeDatabaseReady, alertTransportReady] = await Promise.all([
      dependencies.verifyStripeProductAndZeroOpenSessions(),
      dependencies.verifyRuntimeSchema(),
      dependencies.verifyRuntimeDatabaseRoleAndEndpoint(),
      dependencies.verifyPaymentAlertTransportWithoutSending(),
    ]);

    return stripeReady && schemaReady && runtimeDatabaseReady && alertTransportReady;
  } catch {
    return false;
  }
}
