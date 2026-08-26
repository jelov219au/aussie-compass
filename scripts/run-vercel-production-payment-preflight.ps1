param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedProductionSha
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$launcherPath = Join-Path $PSScriptRoot "invoke-vercel-cli-with-ascii-hostname.mjs"
$maskedPreflightPath = Join-Path $PSScriptRoot "run-production-payment-preflight.ps1"
$childBootstrapPath = Join-Path $PSScriptRoot "run-production-payment-preflight-with-bypass.ps1"
$environmentExamplePath = Join-Path $projectRoot ".env.example"
$vercelPackage = "vercel@59.5.0"
$exitCode = 1
$failureReason = "input_or_runtime_error"

$forbiddenDotEnvFiles = @(
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local"
)

try {
  $failureReason = "invalid_expected_endpoint"
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') {
    throw "ExpectedNeonEndpointId must be a separately approved endpoint ID."
  }

  $failureReason = "invalid_expected_production_sha"
  if ($ExpectedProductionSha -cnotmatch '^[a-f0-9]{40}$') {
    throw "ExpectedProductionSha must be the full owner-approved lowercase SHA."
  }

  $failureReason = "operator_launcher_unavailable"
  if (-not (Test-Path -LiteralPath $launcherPath -PathType Leaf)) {
    throw "The pinned Vercel launcher is unavailable."
  }

  $failureReason = "masked_preflight_unavailable"
  if (-not (Test-Path -LiteralPath $maskedPreflightPath -PathType Leaf)) {
    throw "The existing masked Production preflight is unavailable."
  }

  $failureReason = "child_bootstrap_unavailable"
  if (-not (Test-Path -LiteralPath $childBootstrapPath -PathType Leaf)) {
    throw "The child-only Automation Bypass bootstrap is unavailable."
  }

  $failureReason = "environment_contract_unavailable"
  if (-not (Test-Path -LiteralPath $environmentExamplePath -PathType Leaf)) {
    throw "The tracked environment-name contract is unavailable."
  }

  $failureReason = "local_environment_file_present"
  foreach ($fileName in $forbiddenDotEnvFiles) {
    if (Test-Path -LiteralPath (Join-Path $projectRoot $fileName) -PathType Leaf) {
      throw "Remove local environment files before loading the Vercel Production operator environment."
    }
  }

  $projectVariableNames = @()
  foreach ($line in Get-Content -LiteralPath $environmentExamplePath) {
    if ($line -cmatch '^\s*([A-Z][A-Z0-9_]*)\s*=') {
      $projectVariableNames += $Matches[1]
    }
  }
  $forbiddenProcessVariables = @(
    $projectVariableNames
    "ENTITLEMENT_DB_DATABASE_URL"
    "VERCEL_ENV"
    "VERCEL_AUTOMATION_BYPASS_SECRET"
    "VERCEL_TOKEN"
    "NODE_OPTIONS"
  ) | Sort-Object -Unique

  $failureReason = "operator_environment_preloaded"
  foreach ($variableName in $forbiddenProcessVariables) {
    if (Test-Path -LiteralPath ("Env:" + $variableName)) {
      throw "Start from a clean operator process; runtime and masked audit values must not be preloaded."
    }
  }

  $failureReason = "vercel_cli_auth_required"
  & npx.cmd --yes --package=$vercelPackage -- node $launcherPath whoami --no-color *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Authenticate separately with the pinned ASCII-hostname launcher before running the preflight."
  }

  [Environment]::SetEnvironmentVariable("VERCEL_ENV", "production", "Process")

  $failureReason = "integrated_preflight_failed"
  Push-Location -LiteralPath $projectRoot
  try {
    & npx.cmd --yes --package=$vercelPackage -- node $launcherPath env run -e production --project aussie-compass --no-color -- powershell.exe -NoProfile -ExecutionPolicy Bypass -File $childBootstrapPath -ExpectedNeonEndpointId $ExpectedNeonEndpointId -ExpectedProductionSha $ExpectedProductionSha
    if ($LASTEXITCODE -ne 0) {
      throw "The integrated Production preflight failed closed."
    }
  } finally {
    Pop-Location
  }

  $exitCode = 0
} catch {
  # Emit only the fixed stage reason. CLI and third-party details can contain operator data.
} finally {
  Remove-Item -LiteralPath "Env:VERCEL_ENV" -ErrorAction SilentlyContinue
}

if ($exitCode -eq 0) {
  Write-Host "VERCEL_PRODUCTION_PREFLIGHT=PASS environment=production project=pinned payments=off exact_sha=required endpoint=required secrets_printed=no"
} else {
  Write-Host "VERCEL_PRODUCTION_PREFLIGHT=FAIL environment=production project=pinned payments=off exact_sha=required endpoint=required secrets_printed=no launch=NO-GO reason=$failureReason"
}

exit $exitCode
