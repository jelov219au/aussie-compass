param(
  [string]$From,
  [string]$To
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$accountingRoot = Join-Path $projectRoot "private\accounting"
$credentialPath = Join-Path $accountingRoot "stripe-accounting-key.xml"

if (-not (Test-Path -LiteralPath $credentialPath)) {
  throw "The protected accounting credential is missing. Run scripts\setup-accounting-automation.ps1 first."
}

if (-not $From -or -not $To) {
  $currentMonth = Get-Date -Day 1 -Hour 0 -Minute 0 -Second 0
  $previousMonth = $currentMonth.AddMonths(-1)
  $From = $previousMonth.ToString("yyyy-MM-dd")
  $To = $currentMonth.ToString("yyyy-MM-dd")
}

if ($From -notmatch '^\d{4}-\d{2}-\d{2}$' -or $To -notmatch '^\d{4}-\d{2}-\d{2}$') {
  throw "From and To must use YYYY-MM-DD."
}

$credential = Import-Clixml -LiteralPath $credentialPath
$plainKey = $credential.GetNetworkCredential().Password

if ($plainKey -notmatch '^rk_(live|test)_') {
  throw "The saved accounting credential is not a restricted Stripe key."
}

$mode = if ($plainKey.StartsWith("rk_live_")) { "live" } else { "test" }
$targetName = "stripe-balance-$mode-$From-to-$To-exclusive.csv"
$targetPath = Join-Path $accountingRoot $targetName

try {
  $env:STRIPE_ACCOUNTING_KEY = $plainKey

  if (-not (Test-Path -LiteralPath $targetPath)) {
    & npm.cmd run accounting:export -- --from $From --to $To
    if ($LASTEXITCODE -ne 0) { throw "Stripe accounting export failed." }
  }

  & npm.cmd run accounting:merge
  if ($LASTEXITCODE -ne 0) { throw "Accounting ledger merge failed." }
} finally {
  Remove-Item Env:STRIPE_ACCOUNTING_KEY -ErrorAction SilentlyContinue
  $plainKey = $null
}
