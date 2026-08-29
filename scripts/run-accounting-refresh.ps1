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

if (($From -and -not $To) -or ($To -and -not $From)) {
  throw "Provide both From and To, or omit both for the scheduled daily and monthly refresh."
}

$windows = @()
if ($From -and $To) {
  $windows += [PSCustomObject]@{ From = $From; To = $To }
} else {
  $utcToday = [DateTime]::UtcNow.Date
  $utcMonthStart = [DateTime]::new($utcToday.Year, $utcToday.Month, 1, 0, 0, 0, [DateTimeKind]::Utc)
  $previousUtcMonth = $utcMonthStart.AddMonths(-1)
  if ($utcToday -gt $utcMonthStart) {
    $windows += [PSCustomObject]@{ From = $utcMonthStart.ToString("yyyy-MM-dd"); To = $utcToday.ToString("yyyy-MM-dd") }
  }
  $windows += [PSCustomObject]@{ From = $previousUtcMonth.ToString("yyyy-MM-dd"); To = $utcMonthStart.ToString("yyyy-MM-dd") }
}

foreach ($window in $windows) {
  if ($window.From -notmatch '^\d{4}-\d{2}-\d{2}$' -or $window.To -notmatch '^\d{4}-\d{2}-\d{2}$') {
    throw "From and To must use YYYY-MM-DD."
  }
}

$credential = Import-Clixml -LiteralPath $credentialPath
$plainKey = $credential.GetNetworkCredential().Password

if ($plainKey -notmatch '^rk_(live|test)_') {
  throw "The saved accounting credential is not a restricted Stripe key."
}

$mode = if ($plainKey.StartsWith("rk_live_")) { "live" } else { "test" }
try {
  $env:STRIPE_ACCOUNTING_KEY = $plainKey

  foreach ($window in $windows) {
    $targetName = "stripe-balance-$mode-$($window.From)-to-$($window.To)-exclusive.csv"
    $targetPath = Join-Path $accountingRoot $targetName
    if (-not (Test-Path -LiteralPath $targetPath)) {
      & npm.cmd run accounting:export -- --from $window.From --to $window.To
      if ($LASTEXITCODE -ne 0) { throw "Stripe accounting export failed." }
    }
  }

  & npm.cmd run accounting:merge
  if ($LASTEXITCODE -ne 0) { throw "Accounting ledger merge failed." }
} finally {
  Remove-Item Env:STRIPE_ACCOUNTING_KEY -ErrorAction SilentlyContinue
  $plainKey = $null
}
