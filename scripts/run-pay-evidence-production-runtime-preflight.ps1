param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedProductionSha,
  [Parameter(Mandatory = $true)]
  [string]$DeploymentOrigin,
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
$challenge = $null
$auditKeyHmac = $null
$accountingKeyHmac = $null
$locationPushed = $false
$exitCode = 1
$failureReason = "input_or_runtime_error"

function Test-AuditDatabaseTarget([string]$Value, [string]$EndpointId) {
  try {
    $uri = [Uri]$Value
    $hostName = $uri.DnsSafeHost.ToLowerInvariant()
    $endpointLabel = $hostName.Split('.')[0]
    if ($endpointLabel.EndsWith("-pooler")) { $endpointLabel = $endpointLabel.Substring(0, $endpointLabel.Length - 7) }
    return @("postgres", "postgresql") -contains $uri.Scheme `
      -and $hostName.EndsWith(".neon.tech") `
      -and $endpointLabel -ceq $EndpointId `
      -and $uri.AbsolutePath.TrimEnd('/') -ceq "/neondb"
  } catch { return $false }
}

function Get-HmacHex([string]$Secret, [string]$Message) {
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  try {
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Message))
    return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
  } finally { $hmac.Dispose() }
}

try {
  $failureReason = "invalid_expected_endpoint"
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') { throw "Use the approved Neon endpoint ID." }
  $failureReason = "invalid_expected_production_sha"
  if ($ExpectedProductionSha -cnotmatch '^[a-f0-9]{40}$') { throw "Use the full approved Production SHA." }
  $failureReason = "invalid_deployment_origin"
  try {
    $deploymentUri = [Uri]$DeploymentOrigin
    if (
      $deploymentUri.Scheme -cne "https" -or
      -not $deploymentUri.DnsSafeHost.ToLowerInvariant().EndsWith(".vercel.app") -or
      $deploymentUri.DnsSafeHost.ToLowerInvariant() -ceq "vercel.app" -or
      -not $deploymentUri.IsDefaultPort -or
      $deploymentUri.AbsolutePath -cne "/" -or
      $deploymentUri.Query -or $deploymentUri.Fragment -or $deploymentUri.UserInfo
    ) { throw "invalid" }
    $DeploymentOrigin = $deploymentUri.GetLeftPart([UriPartial]::Authority)
  } catch { throw "Use the exact protected Vercel deployment origin." }

  $failureReason = "dependency_runtime_unavailable"
  Push-Location -LiteralPath $projectRoot
  try {
    & node --input-type=module -e "await Promise.all([import('stripe'), import('@neondatabase/serverless')])" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Required operator dependencies are unavailable." }
  } finally { Pop-Location }

  foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID")) {
    $failureReason = "operator_secret_preloaded"
    if (Test-Path -LiteralPath ("Env:" + $variableName)) { throw "Use only the masked prompts." }
  }

  $failureReason = "masked_key_input_failed"
  $secureAuditKey = Read-Host "Stripe Account-Read restricted key" -AsSecureString
  $auditKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditKey)
  $plainAuditKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditKeyPointer)
  $secureAccountingKey = Read-Host "Stripe Balance-Transactions-Read restricted key" -AsSecureString
  $accountingKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccountingKey)
  $plainAccountingKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountingKeyPointer)
  if (
    $plainAuditKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' -or
    $plainAccountingKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' -or
    $plainAuditKey -ceq $plainAccountingKey
  ) {
    $failureReason = "two_distinct_live_restricted_keys_required"
    throw "Use two different live restricted keys."
  }
  $secureAuditDatabaseUrl = Read-Host "One-off hoju_payment_auditor Neon URL" -AsSecureString
  $auditDatabasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditDatabaseUrl)
  $plainAuditDatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditDatabasePointer)
  if (-not (Test-AuditDatabaseTarget $plainAuditDatabaseUrl $ExpectedNeonEndpointId)) {
    $failureReason = "audit_database_target_mismatch"
    throw "Use the approved endpoint and neondb audit URL."
  }

  $challengeBytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $random.GetBytes($challengeBytes)
    $challenge = ([BitConverter]::ToString($challengeBytes)).Replace("-", "").ToLowerInvariant()
  } finally {
    $random.Dispose()
    [Array]::Clear($challengeBytes, 0, $challengeBytes.Length)
  }
  $auditKeyHmac = Get-HmacHex $plainAuditKey $challenge
  $accountingKeyHmac = Get-HmacHex $plainAccountingKey $challenge

  [Environment]::SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY", $plainAuditKey, "Process")
  [Environment]::SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainAccountingKey, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_AUDIT_DB_URL", $plainAuditDatabaseUrl, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID", $ExpectedNeonEndpointId, "Process")

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true
  $failureReason = "pay_evidence_runtime_preflight_failed"
  & node scripts/pay-evidence-production-runtime-preflight.mjs `
    --deployment $DeploymentOrigin `
    --expected-sha $ExpectedProductionSha `
    --expected-endpoint $ExpectedNeonEndpointId `
    --challenge $challenge `
    --audit-key-hmac $auditKeyHmac `
    --accounting-key-hmac $accountingKeyHmac
  if ($LASTEXITCODE -ne 0) { throw "The protected Pay Evidence runtime check failed." }

  $failureReason = "operator_audit_failed"
  & npm.cmd run payments:operator-audit
  if ($LASTEXITCODE -ne 0) { throw "The Account or audit-database permission check failed." }
  $failureReason = "accounting_permission_preflight_failed"
  & npm.cmd run accounting:preflight
  if ($LASTEXITCODE -ne 0) { throw "The Balance Transactions permission check failed." }
  $exitCode = 0
} catch {
  # Only a fixed stage reason is emitted; exception text can contain operator data.
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
  $challenge = $null
  $auditKeyHmac = $null
  $accountingKeyHmac = $null
}

if ($exitCode -eq 0) {
  Write-Host "PAY_EVIDENCE_FIRST_SALE_PREFLIGHT=PASS mode=live shared_payments=on pay_evidence=off runtime=exact-sha stripe_roles=three-distinct database=runtime+audit-role-pass monitoring=verified persisted=no transactions=none secrets_printed=no"
} else {
  Write-Host "PAY_EVIDENCE_FIRST_SALE_PREFLIGHT=FAIL mode=live shared_payments=unverified pay_evidence=unverified runtime=unverified stripe_roles=unverified database=unverified monitoring=unverified persisted=no transactions=none secrets_printed=no reason=$failureReason"
}
if ($PauseBeforeExit) { Read-Host "Review the fixed PASS or FAIL result, then press Enter to close this window" | Out-Null }
exit $exitCode
