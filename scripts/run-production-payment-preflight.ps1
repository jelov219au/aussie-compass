param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedProductionSha,
  [Parameter(Mandatory = $true)]
  [string]$DeploymentOrigin
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$locationPushed = $false
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
$exitCode = 1
$failureReason = "input_or_runtime_error"

function Write-KeyRoleFailure([string]$Reason, [string]$Distinct = "unverified") {
  Write-Host "STRIPE_KEY_ROLES=FAIL mode=live distinct=$Distinct permissions=unverified secrets_printed=no launch=NO-GO reason=$Reason"
}

function Get-HmacHex([string]$Secret, [string]$Message) {
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  try {
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Message))
    return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
  } finally {
    $hmac.Dispose()
  }
}

try {
  $failureReason = "invalid_expected_endpoint"
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') { throw "Use the separately approved Neon endpoint ID." }
  $failureReason = "invalid_expected_production_sha"
  if ($ExpectedProductionSha -cnotmatch '^[a-f0-9]{40}$') { throw "Use the full owner-approved Production SHA." }
  $failureReason = "invalid_deployment_origin"
  try {
    $deploymentUri = [Uri]$DeploymentOrigin
    if (
      $deploymentUri.Scheme -cne "https" -or
      -not $deploymentUri.DnsSafeHost.ToLowerInvariant().EndsWith(".vercel.app") -or
      $deploymentUri.DnsSafeHost.ToLowerInvariant() -ceq "vercel.app" -or
      -not $deploymentUri.IsDefaultPort -or
      $deploymentUri.AbsolutePath -cne "/" -or
      $deploymentUri.Query -or
      $deploymentUri.Fragment -or
      $deploymentUri.UserInfo
    ) { throw "invalid deployment origin" }
    $DeploymentOrigin = $deploymentUri.GetLeftPart([UriPartial]::Authority)
  } catch {
    throw "Use the exact protected Vercel deployment origin from the outer evidence check."
  }

  foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID")) {
    $failureReason = "operator_secret_preloaded"
    if (Test-Path -LiteralPath ("Env:" + $variableName)) {
      Write-KeyRoleFailure "operator_secret_preloaded"
      throw "Operator audit values must be entered only at masked prompts."
    }
  }

  $failureReason = "masked_key_input_failed"
  $secureAuditKey = Read-Host "One-off Stripe Account-Read audit key" -AsSecureString
  $auditKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditKey)
  $plainAuditKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditKeyPointer)
  $secureAccountingKey = Read-Host "Dedicated Stripe Balance-Transactions-Read accounting key" -AsSecureString
  $accountingKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccountingKey)
  $plainAccountingKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountingKeyPointer)

  $failureReason = "two_local_live_restricted_keys_required"
  if ($plainAuditKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' -or $plainAccountingKey -cnotmatch '^rk_live_[A-Za-z0-9]+$') {
    Write-KeyRoleFailure "two_local_live_restricted_keys_required"
    throw "Use separate live restricted Account-audit and accounting keys."
  }
  if ($plainAuditKey -ceq $plainAccountingKey) {
    $failureReason = "role_reuse"
    Write-KeyRoleFailure "role_reuse" "no"
    throw "Account-audit and accounting keys must be different."
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

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true
  $failureReason = "production_runtime_preflight_failed"
  & npm.cmd --silent run payments:verify-production-runtime -- --deployment $DeploymentOrigin --expected-sha $ExpectedProductionSha --expected-endpoint $ExpectedNeonEndpointId --challenge $challenge --audit-key-hmac $auditKeyHmac --accounting-key-hmac $accountingKeyHmac
  if ($LASTEXITCODE -ne 0) { throw "Protected Production runtime preflight failed closed." }

  $secureAuditDatabaseUrl = Read-Host "One-off hoju_payment_auditor database URL" -AsSecureString
  $auditDatabasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditDatabaseUrl)
  $plainAuditDatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditDatabasePointer)
  $failureReason = "audit_database_target_mismatch"
  try {
    $auditDatabaseUri = [Uri]$plainAuditDatabaseUrl
    $auditHost = $auditDatabaseUri.DnsSafeHost.ToLowerInvariant()
    $auditEndpointLabel = $auditHost.Split('.')[0]
    if ($auditEndpointLabel.EndsWith("-pooler")) { $auditEndpointLabel = $auditEndpointLabel.Substring(0, $auditEndpointLabel.Length - 7) }
    if (@("postgres", "postgresql") -notcontains $auditDatabaseUri.Scheme -or -not $auditHost.EndsWith(".neon.tech") -or $auditEndpointLabel -cne $ExpectedNeonEndpointId -or $auditDatabaseUri.AbsolutePath.TrimEnd('/') -cne "/neondb") {
      throw "invalid audit database target"
    }
  } catch {
    throw "The audit database URL must target the approved Neon endpoint and neondb."
  }

  [Environment]::SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY", $plainAuditKey, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_AUDIT_DB_URL", $plainAuditDatabaseUrl, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID", $ExpectedNeonEndpointId, "Process")
  $failureReason = "operator_audit_failed"
  & npm.cmd run payments:operator-audit
  if ($LASTEXITCODE -ne 0) { throw "Production Account and audit-database checks failed closed." }

  $failureReason = "accounting_permission_preflight_failed"
  [Environment]::SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainAccountingKey, "Process")
  & npm.cmd run accounting:preflight
  if ($LASTEXITCODE -ne 0) { throw "Stripe accounting-key permission preflight failed closed." }

  $exitCode = 0
} catch {
  # Only the fixed stage reason is emitted; exception text can contain third-party details.
} finally {
  if ($locationPushed) { Pop-Location }
  foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "PAYMENTS_AUDIT_DB_URL", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID")) {
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
  Write-Host "STRIPE_KEY_ROLES=PASS mode=live distinct=yes permissions=separate-preflights-required secrets_printed=no"
  Write-Host "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no"
} else {
  Write-Host "FIRST_SALE_PREFLIGHT=FAIL mode=live payments_off=required keys=unverified required_operations=unverified database=unverified secrets_printed=no launch=NO-GO reason=$failureReason"
}

exit $exitCode
