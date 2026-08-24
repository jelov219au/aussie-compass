param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$locationPushed = $false
$setEndpointVariable = $false
$auditKeyPointer = [IntPtr]::Zero
$accountingKeyPointer = [IntPtr]::Zero
$auditDatabasePointer = [IntPtr]::Zero
$plainAuditKey = $null
$plainAccountingKey = $null
$plainAuditDatabaseUrl = $null
$secureAuditKey = $null
$secureAccountingKey = $null
$secureAuditDatabaseUrl = $null

function Write-KeyRoleFailure([string]$Reason, [string]$Distinct = "unverified") {
  Write-Host "STRIPE_KEY_ROLES=FAIL mode=live distinct=$Distinct permissions=unverified secrets_printed=no launch=NO-GO reason=$Reason"
}

if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') {
  throw "Use the separately approved lowercase Neon endpoint ID beginning with ep-."
}
if ($env:VERCEL_ENV -cne "production") {
  throw "Run only from an intentionally loaded Vercel Production operator environment."
}
if ($env:PAYMENTS_ENABLED -cne "false") {
  throw "Production PAYMENTS_ENABLED must be explicitly false before this read-only preflight."
}
if ($env:STRIPE_SECRET_KEY -cnotmatch '^rk_live_[A-Za-z0-9]+$') {
  Write-KeyRoleFailure "runtime_live_restricted_key_required"
  throw "The loaded Production runtime must use a live restricted Stripe key."
}
if (Test-Path -LiteralPath "Env:PAYMENTS_STRIPE_AUDIT_KEY") {
  Write-KeyRoleFailure "audit_key_preloaded"
  throw "PAYMENTS_STRIPE_AUDIT_KEY must not be preloaded or persisted. Remove it and use the masked prompt."
}
if (Test-Path -LiteralPath "Env:STRIPE_ACCOUNTING_KEY") {
  Write-KeyRoleFailure "accounting_key_preloaded"
  throw "STRIPE_ACCOUNTING_KEY must not be preloaded or persisted for the strict Production audit. Remove it and use the masked prompt."
}
if (Test-Path -LiteralPath "Env:PAYMENTS_AUDIT_DB_URL") {
  throw "PAYMENTS_AUDIT_DB_URL must not be preloaded or persisted. Remove it and use the masked prompt."
}

$runtimeDatabaseUrl = if ($env:ENTITLEMENT_DB_URL) {
  $env:ENTITLEMENT_DB_URL
} else {
  $env:ENTITLEMENT_DB_DATABASE_URL
}

try {
  $runtimeDatabaseUri = [Uri]$runtimeDatabaseUrl
  $runtimeHost = $runtimeDatabaseUri.DnsSafeHost.ToLowerInvariant()
  $runtimeEndpointLabel = $runtimeHost.Split('.')[0]
  if ($runtimeEndpointLabel.EndsWith("-pooler")) {
    $runtimeEndpointLabel = $runtimeEndpointLabel.Substring(0, $runtimeEndpointLabel.Length - 7)
  }
  if (@("postgres", "postgresql") -notcontains $runtimeDatabaseUri.Scheme -or -not $runtimeHost.EndsWith(".neon.tech") -or $runtimeEndpointLabel -cne $ExpectedNeonEndpointId -or $runtimeDatabaseUri.AbsolutePath.TrimEnd('/') -cne "/neondb") {
    throw "The loaded Production runtime database does not match the approved Neon endpoint."
  }
} catch {
  throw "The loaded Production runtime database does not match the approved Neon endpoint."
}

$existingEndpointId = $env:PAYMENTS_EXPECTED_NEON_ENDPOINT_ID
if ($existingEndpointId) {
  if ($existingEndpointId.Trim().ToLowerInvariant() -cne $ExpectedNeonEndpointId) {
    throw "The existing endpoint pin does not match the separately approved Neon endpoint."
  }
} else {
  [Environment]::SetEnvironmentVariable("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID", $ExpectedNeonEndpointId, "Process")
  $setEndpointVariable = $true
}

try {
  $secureAuditKey = Read-Host "One-off Stripe Account-Read audit key" -AsSecureString
  $auditKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditKey)
  $plainAuditKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditKeyPointer)

  $secureAccountingKey = Read-Host "Dedicated Stripe Balance-Transactions-Read accounting key" -AsSecureString
  $accountingKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccountingKey)
  $plainAccountingKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountingKeyPointer)

  if ($plainAuditKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' -or $plainAccountingKey -cnotmatch '^rk_live_[A-Za-z0-9]+$') {
    Write-KeyRoleFailure "three_live_restricted_keys_required"
    throw "Use three separate rk_live_ restricted keys for runtime, Account audit and accounting."
  }
  if (
    ($plainAuditKey -ceq $env:STRIPE_SECRET_KEY) -or
    ($plainAccountingKey -ceq $env:STRIPE_SECRET_KEY) -or
    ($plainAccountingKey -ceq $plainAuditKey)
  ) {
    Write-KeyRoleFailure "role_reuse" "no"
    throw "Runtime, Account-audit and accounting Stripe keys must be different."
  }
  Write-Host "STRIPE_KEY_ROLES=PASS mode=live distinct=yes permissions=separate-preflights-required secrets_printed=no"

  $secureAuditDatabaseUrl = Read-Host "One-off hoju_payment_auditor database URL" -AsSecureString
  $auditDatabasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAuditDatabaseUrl)
  $plainAuditDatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($auditDatabasePointer)
  try {
    $auditDatabaseUri = [Uri]$plainAuditDatabaseUrl
    $auditHost = $auditDatabaseUri.DnsSafeHost.ToLowerInvariant()
    $auditEndpointLabel = $auditHost.Split('.')[0]
    if ($auditEndpointLabel.EndsWith("-pooler")) {
      $auditEndpointLabel = $auditEndpointLabel.Substring(0, $auditEndpointLabel.Length - 7)
    }
    if (@("postgres", "postgresql") -notcontains $auditDatabaseUri.Scheme -or -not $auditHost.EndsWith(".neon.tech") -or $auditEndpointLabel -cne $ExpectedNeonEndpointId -or $auditDatabaseUri.AbsolutePath.TrimEnd('/') -cne "/neondb") {
      throw "invalid audit database target"
    }
  } catch {
    throw "The audit database URL must target hoju_payment_auditor on the approved Neon endpoint and neondb."
  }

  [Environment]::SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY", $plainAuditKey, "Process")
  [Environment]::SetEnvironmentVariable("PAYMENTS_AUDIT_DB_URL", $plainAuditDatabaseUrl, "Process")

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true
  & npm.cmd run payments:check -- --preflight --strict --verify-stripe --verify-database
  if ($LASTEXITCODE -ne 0) { throw "Production payment preflight failed closed." }
} finally {
  if ($locationPushed) {
    Pop-Location
  }
  Remove-Item -LiteralPath "Env:PAYMENTS_STRIPE_AUDIT_KEY" -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath "Env:PAYMENTS_AUDIT_DB_URL" -ErrorAction SilentlyContinue
  if ($setEndpointVariable) {
    Remove-Item -LiteralPath "Env:PAYMENTS_EXPECTED_NEON_ENDPOINT_ID" -ErrorAction SilentlyContinue
  }
  if ($auditKeyPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($auditKeyPointer)
  }
  if ($accountingKeyPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accountingKeyPointer)
  }
  if ($auditDatabasePointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($auditDatabasePointer)
  }
  $plainAuditKey = $null
  $plainAccountingKey = $null
  $plainAuditDatabaseUrl = $null
  $secureAuditKey = $null
  $secureAccountingKey = $null
  $secureAuditDatabaseUrl = $null
}
