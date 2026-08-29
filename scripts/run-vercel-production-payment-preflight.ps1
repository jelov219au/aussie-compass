param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedProductionSha
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$maskedPreflightPath = Join-Path $PSScriptRoot "run-production-payment-preflight.ps1"
$environmentExamplePath = Join-Path $projectRoot ".env.example"
$exitCode = 1
$failureReason = "input_or_runtime_error"
$monitoringMode = "unverified"

$forbiddenDotEnvFiles = @(
  ".env", ".env.local", ".env.development", ".env.development.local",
  ".env.production", ".env.production.local", ".env.test", ".env.test.local"
)

try {
  $failureReason = "invalid_expected_endpoint"
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') { throw "ExpectedNeonEndpointId must be separately approved." }
  $failureReason = "invalid_expected_production_sha"
  if ($ExpectedProductionSha -cnotmatch '^[a-f0-9]{40}$') { throw "ExpectedProductionSha must be the full approved SHA." }
  $failureReason = "masked_preflight_unavailable"
  if (-not (Test-Path -LiteralPath $maskedPreflightPath -PathType Leaf)) { throw "The masked Production preflight is unavailable." }
  $failureReason = "environment_contract_unavailable"
  if (-not (Test-Path -LiteralPath $environmentExamplePath -PathType Leaf)) { throw "The environment-name contract is unavailable." }

  $failureReason = "local_environment_file_present"
  foreach ($fileName in $forbiddenDotEnvFiles) {
    if (Test-Path -LiteralPath (Join-Path $projectRoot $fileName) -PathType Leaf) { throw "Remove local environment files before the operator preflight." }
  }

  $projectVariableNames = @()
  foreach ($line in Get-Content -LiteralPath $environmentExamplePath) {
    if ($line -cmatch '^\s*([A-Z][A-Z0-9_]*)\s*=') { $projectVariableNames += $Matches[1] }
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
    if (Test-Path -LiteralPath ("Env:" + $variableName)) { throw "Start from a clean operator process." }
  }

  Push-Location -LiteralPath $projectRoot
  try {
    # deployment:verify-production performs authenticated protected reads with
    # the pinned ASCII-hostname launcher while explicitly removing VERCEL_TOKEN.
    # This is stronger evidence than a separate `whoami` probe and avoids a
    # Windows PowerShell false-negative before the masked operator prompts.
    $failureReason = "production_deployment_evidence_failed"
    $deploymentEvidence = @(& npm.cmd run deployment:verify-production -- --expected-sha $ExpectedProductionSha 2>$null)
    if ($LASTEXITCODE -ne 0) { throw "Production deployment evidence failed closed." }
    $deploymentPass = @($deploymentEvidence | Where-Object { $_ -ceq "PRODUCTION_DEPLOYMENT_EVIDENCE=PASS source_sha=exact environment=production deployment=success origins=same-dpl-id public_markers=verified payments=off secrets_printed=no" })
    $deploymentUrls = @($deploymentEvidence | Where-Object { $_ -cmatch '^PRODUCTION_DEPLOYMENT_URL=(https://[a-z0-9-]+\.vercel\.app)$' })
    if ($deploymentPass.Count -ne 1 -or $deploymentUrls.Count -ne 1) { throw "Production deployment evidence output was not canonical." }
    $DeploymentOrigin = ([regex]::Match($deploymentUrls[0], '^PRODUCTION_DEPLOYMENT_URL=(https://[a-z0-9-]+\.vercel\.app)$')).Groups[1].Value

    $failureReason = "integrated_preflight_failed"
    $LASTEXITCODE = 1
    $innerPreflightOutput = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $maskedPreflightPath -ExpectedNeonEndpointId $ExpectedNeonEndpointId -ExpectedProductionSha $ExpectedProductionSha -DeploymentOrigin $DeploymentOrigin 2>$null)
    $innerPreflightExitCode = $LASTEXITCODE
    foreach ($line in $innerPreflightOutput) { Write-Host $line }
    $innerPreflightRecords = @($innerPreflightOutput | Where-Object { $_ -cmatch '^FIRST_SALE_PREFLIGHT=' })
    $innerSmtpPass = "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=smtp keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no"
    $innerManualPass = "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=manual keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no"
    if ($innerPreflightExitCode -ne 0 -or $innerPreflightRecords.Count -ne 1) { throw "The integrated Production preflight failed closed." }
    if ($innerPreflightRecords[0] -ceq $innerSmtpPass) {
      $monitoringMode = "smtp"
    } elseif ($innerPreflightRecords[0] -ceq $innerManualPass) {
      $monitoringMode = "manual"
    } else {
      throw "The integrated Production preflight returned a non-canonical monitoring mode."
    }
  } finally {
    Pop-Location
  }

  foreach ($line in $deploymentEvidence) {
    if ($line -cmatch '^PRODUCTION_(?:DEPLOYMENT_EVIDENCE=PASS|DEPLOYMENT_URL=|PUBLIC_URL=)') { Write-Host $line }
  }
  $exitCode = 0
} catch {
  # Emit only the fixed stage reason. CLI and third-party details can contain operator data.
}

if ($exitCode -eq 0) {
  Write-Host "VERCEL_PRODUCTION_PREFLIGHT=PASS environment=production project=pinned payments=off monitoring=$monitoringMode exact_sha=required endpoint=required secrets_printed=no"
} else {
  Write-Host "VERCEL_PRODUCTION_PREFLIGHT=FAIL environment=production project=pinned payments=off monitoring=unverified exact_sha=required endpoint=required secrets_printed=no launch=NO-GO reason=$failureReason"
}

exit $exitCode
