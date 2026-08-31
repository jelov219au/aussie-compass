param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [switch]$PauseBeforeExit
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$auditKeyPointer = [IntPtr]::Zero
$accountingKeyPointer = [IntPtr]::Zero
$auditDatabasePointer = [IntPtr]::Zero
$plainAuditKey = $null
$plainAccountingKey = $null
$plainAuditDatabaseUrl = $null
$secureAuditKey = $null
$secureAccountingKey = $null
$secureAuditDatabaseUrl = $null
$locationPushed = $false
$exitCode = 1
$failureReason = "input_or_runtime_error"

function Test-AuditDatabaseTarget([string]$Value, [string]$EndpointId) {
  try {
    $uri = [Uri]$Value
    $hostName = $uri.DnsSafeHost.ToLowerInvariant()
    $endpointLabel = $hostName.Split('.')[0]
    if ($endpointLabel.EndsWith("-pooler")) {
      $endpointLabel = $endpointLabel.Substring(0, $endpointLabel.Length - 7)
    }
    return @("postgres", "postgresql") -contains $uri.Scheme `
      -and $hostName.EndsWith(".neon.tech") `
      -and $endpointLabel -ceq $EndpointId `
      -and $uri.AbsolutePath.TrimEnd('/') -ceq "/neondb"
  } catch {
    return $false
  }
}

try {
  $failureReason = "invalid_expected_endpoint"
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') {
    throw "Use the separately approved Neon endpoint ID."
  }

  $failureReason = "dependency_runtime_unavailable"
  Push-Location -LiteralPath $projectRoot
  try {
    & node --input-type=module -e "await Promise.all([import('stripe'), import('@neondatabase/serverless')])" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Required operator dependencies are unavailable." }
  } finally {
    Pop-Location
  }

  foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID")) {
    $failureReason = "operator_secret_preloaded"
    if (Test-Path -LiteralPath ("Env:" + $variableName)) {
      throw "Start from a clean process and use only the masked prompts."
    }
  }

  $failureReason = "masked_key_input_failed"
  $secureAuditKey = Read-Host "Stripe Account-Read restricted key" -AsSecureString
  $auditKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditKey)
  $plainAuditKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditKeyPointer)

  $secureAccountingKey = Read-Host "Stripe Balance-Transactions-Read restricted key" -AsSecureString
  $accountingKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccountingKey)
  $plainAccountingKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountingKeyPointer)

  $failureReason = "two_distinct_live_restricted_keys_required"
  if (
    $plainAuditKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' `
    -or $plainAccountingKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' `
    -or $plainAuditKey -ceq $plainAccountingKey
  ) {
    throw "Use two different live restricted keys."
  }

  $secureAuditDatabaseUrl = Read-Host "One-off hoju_payment_auditor Neon URL" -AsSecureString
  $auditDatabasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditDatabaseUrl)
  $plainAuditDatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditDatabasePointer)

  $failureReason = "audit_database_target_mismatch"
  if (-not (Test-AuditDatabaseTarget $plainAuditDatabaseUrl $ExpectedNeonEndpointId)) {
    throw "Use the approved endpoint and neondb audit URL."
  }

  [Environment]::SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY", $plainAuditKey, "Process")
  [Environment]::SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainAccountingKey, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_AUDIT_DB_URL", $plainAuditDatabaseUrl, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID", $ExpectedNeonEndpointId, "Process")

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true

  $failureReason = "operator_audit_failed"
  & npm.cmd run payments:operator-audit
  if ($LASTEXITCODE -ne 0) { throw "The Account or audit-database permission check failed." }

  $failureReason = "accounting_permission_preflight_failed"
  & npm.cmd run accounting:preflight
  if ($LASTEXITCODE -ne 0) { throw "The Balance Transactions permission check failed." }

  $exitCode = 0
} catch {
  # Only the fixed stage reason is emitted; exception text can contain operator data.
} finally {
  if ($locationPushed) { Pop-Location }
  foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID")) {
    Remove-Item -LiteralPath ("Env:" + $variableName) -ErrorAction SilentlyContinue
  }
  if ($auditKeyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($auditKeyPointer) }
  if ($accountingKeyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accountingKeyPointer) }
  if ($auditDatabasePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($auditDatabasePointer) }
  $plainAuditKey = $null
  $plainAccountingKey = $null
  $plainAuditDatabaseUrl = $null
  $secureAuditKey = $null
  $secureAccountingKey = $null
  $secureAuditDatabaseUrl = $null
}

if ($exitCode -eq 0) {
  Write-Host "PAY_EVIDENCE_OPERATOR_KEYS=PASS mode=live account_read=verified balance_transactions_read=verified database=audit-role-pass endpoint=exact persisted=no runtime_distinctness=pending-deployment-hmac secrets_printed=no"
} else {
  Write-Host "PAY_EVIDENCE_OPERATOR_KEYS=FAIL mode=live permissions=unverified database=unverified endpoint=unverified persisted=no runtime_distinctness=unverified secrets_printed=no reason=$failureReason"
}

if ($PauseBeforeExit) {
  Read-Host "Review the fixed PASS or FAIL result, then press Enter to close this window" | Out-Null
}

exit $exitCode
