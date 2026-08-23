param(
  [switch]$AllowTest
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$secureKey = Read-Host "Stripe accounting restricted key" -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
$plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
$locationPushed = $false

if (-not $plainKey) {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  throw "The Stripe accounting restricted key is required."
}

try {
  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true

  if ($plainKey -notmatch '^rk_(live|test)_[A-Za-z0-9]+$') {
    throw "Use a dedicated restricted Stripe accounting key beginning with rk_live_ or rk_test_."
  }
  if (-not $AllowTest -and -not $plainKey.StartsWith("rk_live_")) {
    throw "The first-customer accounting preflight requires an rk_live_ key. Use -AllowTest only for an explicit non-launch test."
  }

  [Environment]::SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainKey, "Process")
  & npm.cmd run accounting:preflight
  if ($LASTEXITCODE -ne 0) { throw "Stripe accounting preflight failed." }
} finally {
  if ($locationPushed) {
    Pop-Location
  }
  Remove-Item -LiteralPath "Env:STRIPE_ACCOUNTING_KEY" -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  $plainKey = $null
  $secureKey = $null
}
