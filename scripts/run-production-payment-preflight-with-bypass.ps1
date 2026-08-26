param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedNeonEndpointId,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedProductionSha
)

$ErrorActionPreference = "Stop"
$maskedPreflightPath = Join-Path $PSScriptRoot "run-production-payment-preflight.ps1"
$bypassPointer = [IntPtr]::Zero
$plainBypassSecret = $null
$secureBypassSecret = $null
$exitCode = 1

try {
  if ($ExpectedNeonEndpointId -cnotmatch '^ep-[a-z0-9-]+$') {
    throw "ExpectedNeonEndpointId must be a separately approved endpoint ID."
  }
  if ($ExpectedProductionSha -cnotmatch '^[a-f0-9]{40}$') {
    throw "ExpectedProductionSha must be the full owner-approved lowercase SHA."
  }
  if (-not (Test-Path -LiteralPath $maskedPreflightPath -PathType Leaf)) {
    throw "The existing masked Production preflight is unavailable."
  }
  if (Test-Path -LiteralPath "Env:VERCEL_AUTOMATION_BYPASS_SECRET") {
    throw "The Automation Bypass secret must not be stored in the Vercel environment."
  }

  $secureBypassSecret = Read-Host "Process-only Vercel Automation Bypass secret" -AsSecureString
  $bypassPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureBypassSecret)
  $plainBypassSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bypassPointer)
  if ([string]::IsNullOrWhiteSpace($plainBypassSecret) -or $plainBypassSecret.Length -lt 16 -or $plainBypassSecret.Length -gt 256) {
    throw "Use the project-specific Automation Bypass secret at the masked prompt."
  }

  [Environment]::SetEnvironmentVariable("VERCEL_AUTOMATION_BYPASS_SECRET", $plainBypassSecret, "Process")
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $maskedPreflightPath -ExpectedNeonEndpointId $ExpectedNeonEndpointId -ExpectedProductionSha $ExpectedProductionSha
  if ($LASTEXITCODE -ne 0) {
    throw "The existing masked Production preflight failed closed."
  }
  $exitCode = 0
} catch {
  # The outer operator wrapper owns the fixed public failure result.
} finally {
  Remove-Item -LiteralPath "Env:VERCEL_AUTOMATION_BYPASS_SECRET" -ErrorAction SilentlyContinue
  if ($bypassPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bypassPointer)
  }
  $plainBypassSecret = $null
  $secureBypassSecret = $null
}

exit $exitCode
