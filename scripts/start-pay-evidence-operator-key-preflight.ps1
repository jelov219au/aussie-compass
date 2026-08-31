param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$preflightPath = Join-Path $PSScriptRoot "run-pay-evidence-operator-key-preflight.ps1"

if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') {
  Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=FAIL reason=invalid_expected_endpoint"
  exit 1
}
if (-not (Test-Path -LiteralPath $preflightPath -PathType Leaf)) {
  Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=FAIL reason=preflight_unavailable"
  exit 1
}

Push-Location -LiteralPath $projectRoot
try {
  & node --input-type=module -e "await Promise.all([import('stripe'), import('@neondatabase/serverless')])" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=FAIL reason=dependency_runtime_unavailable"
    exit 1
  }
} finally {
  Pop-Location
}

$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", ('"' + $preflightPath + '"'),
  "-ExpectedNeonEndpointId", $ExpectedNeonEndpointId,
  "-PauseBeforeExit"
)

try {
  $process = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList $arguments `
    -WorkingDirectory $projectRoot `
    -WindowStyle Normal `
    -PassThru
  $process.WaitForExit()
  if ($process.ExitCode -eq 0) {
    Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=PASS input=external-powershell child=pass secrets_printed=no"
    exit 0
  }
  Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=FAIL input=external-powershell child=fail secrets_printed=no"
  exit 1
} catch {
  Write-Host "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=FAIL input=external-powershell child=unavailable secrets_printed=no"
  exit 1
}
