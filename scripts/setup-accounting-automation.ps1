$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$accountingRoot = Join-Path $projectRoot "private\accounting"
$credentialPath = Join-Path $accountingRoot "stripe-accounting-key.xml"
$refreshScript = Join-Path $PSScriptRoot "run-accounting-refresh.ps1"
$taskName = "Hoju Compass - Stripe accounting refresh"

New-Item -ItemType Directory -Path $accountingRoot -Force | Out-Null

Write-Host "Paste a dedicated read-only Stripe restricted key. The key is encrypted for this Windows user and is never written to source control."
$secureKey = Read-Host "Stripe accounting key (rk_live_...)" -AsSecureString
$credential = [System.Management.Automation.PSCredential]::new("stripe-accounting", $secureKey)
$plainKey = $credential.GetNetworkCredential().Password

try {
  if ($plainKey -notmatch '^rk_(live|test)_') {
    throw "Use a dedicated restricted Stripe key beginning with rk_live_ or rk_test_."
  }

  $credential | Export-Clixml -LiteralPath $credentialPath
} finally {
  $plainKey = $null
}

$powerShell = (Get-Command powershell.exe).Source
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$refreshScript`""
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At 7:15am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Refreshes the previous completed month of Hoju Compass Stripe balance records. Re-runs are idempotent." -Force | Out-Null

Write-Host "Accounting automation is ready. The previous completed month will be checked daily at 7:15am and exported only once."
