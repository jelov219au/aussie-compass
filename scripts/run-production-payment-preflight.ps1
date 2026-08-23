param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$locationPushed = $false
$setEndpointVariable = $false
$auditKeyPointer = [IntPtr]::Zero
$auditDatabasePointer = [IntPtr]::Zero
$plainAuditKey = $null
$plainAuditDatabaseUrl = $null
$secureAuditKey = $null
$secureAuditDatabaseUrl = $null

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
  throw "The loaded Production runtime must use a live restricted Stripe key."
}
if (Test-Path -LiteralPath "Env:PAYMENTS_STRIPE_AUDIT_KEY") {
  throw "PAYMENTS_STRIPE_AUDIT_KEY must not be preloaded or persisted. Remove it and use the masked prompt."
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
  if ($plainAuditKey -cnotmatch '^rk_live_[A-Za-z0-9]+$' -or $plainAuditKey -ceq $env:STRIPE_SECRET_KEY) {
    throw "Use a separate one-off rk_live_ key with Account Read only."
  }

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
  if ($auditDatabasePointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($auditDatabasePointer)
  }
  $plainAuditKey = $null
  $plainAuditDatabaseUrl = $null
  $secureAuditKey = $null
  $secureAuditDatabaseUrl = $null
}
