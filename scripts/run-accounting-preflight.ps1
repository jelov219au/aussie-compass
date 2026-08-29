$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$secureKey = $null
$keyPointer = [IntPtr]::Zero
$plainKey = $null
$locationPushed = $false
$exitCode = 1
$failureReason = "input_or_runtime_error"

try {
  $secureKey = Read-Host "Stripe accounting live restricted key" -AsSecureString
  $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)

  if (-not $plainKey) {
    $failureReason = "live_restricted_key_required"
    throw "The Stripe accounting live restricted key is required."
  }

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true

  if ($plainKey -notmatch '^rk_live_[A-Za-z0-9]+$') {
    $failureReason = "live_restricted_key_required"
    throw "The first-customer accounting preflight requires a dedicated rk_live_ restricted key."
  }

  [Environment]::SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainKey, "Process")
  & npm.cmd run accounting:preflight
  if ($LASTEXITCODE -ne 0) {
    $failureReason = "stripe_verification_failed"
    throw "Stripe accounting preflight failed."
  }

  $exitCode = 0
} catch {
  Write-Host "ACCOUNTING_PREFLIGHT=FAIL mode=unverified permission=unverified private_file_written=no launch=NO-GO reason=$failureReason"
} finally {
  if ($locationPushed) {
    Pop-Location
  }
  Remove-Item -LiteralPath "Env:STRIPE_ACCOUNTING_KEY" -ErrorAction SilentlyContinue
  if ($keyPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  }
  $plainKey = $null
  $secureKey = $null
}

if ($exitCode -eq 0) {
  Write-Host "ACCOUNTING_PREFLIGHT=PASS mode=live permission=balance_transactions.read private_file_written=no"
}

exit $exitCode
