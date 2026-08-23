param(
  [switch]$SendTest,
  [string]$SmtpHost = "smtppro.zoho.com",
  [int]$SmtpPort = 465
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$locationPushed = $false
$passwordPointer = [IntPtr]::Zero
$plainPassword = $null
$securePassword = $null
$temporaryEnvironmentNames = @(
  "VERCEL_ENV",
  "PAYMENTS_ENABLED",
  "PAYMENT_ALERTS_ENABLED",
  "PAYMENT_ALERT_TO_EMAIL",
  "PAYMENT_ALERT_FROM_EMAIL",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "ZOHO_SMTP_HOST",
  "ZOHO_SMTP_PORT",
  "ZOHO_SMTP_USER"
)
$originalEnvironment = @{}

if ($SmtpHost -cne "smtppro.zoho.com" -or $SmtpPort -ne 465) {
  throw "This operator check is pinned to smtppro.zoho.com on port 465."
}
if (Test-Path -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD") {
  throw "ZOHO_SMTP_APP_PASSWORD must not be preloaded or persisted. Remove it and use the masked prompt."
}
if (Test-Path -LiteralPath "Env:PAYMENT_ALERT_TEST_ACK") {
  throw "PAYMENT_ALERT_TEST_ACK must not be preloaded. The wrapper supplies it only for an explicit -SendTest run."
}
foreach ($name in $temporaryEnvironmentNames) {
  $existing = Get-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
  $originalEnvironment[$name] = if ($null -eq $existing) { $null } else { $existing.Value }
}

try {
  $securePassword = Read-Host "Zoho payment-alert app password" -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if (-not $plainPassword) {
    throw "The Zoho app password is required."
  }

  $env:VERCEL_ENV = "production"
  $env:PAYMENTS_ENABLED = "false"
  $env:PAYMENT_ALERTS_ENABLED = "true"
  $env:PAYMENT_ALERT_TO_EMAIL = "support@hojucompass.com"
  $env:PAYMENT_ALERT_FROM_EMAIL = "support@hojucompass.com"
  $env:NEXT_PUBLIC_SUPPORT_EMAIL = "support@hojucompass.com"
  $env:ZOHO_SMTP_HOST = $SmtpHost
  $env:ZOHO_SMTP_PORT = $SmtpPort.ToString()
  $env:ZOHO_SMTP_USER = "support@hojucompass.com"
  [Environment]::SetEnvironmentVariable("ZOHO_SMTP_APP_PASSWORD", $plainPassword, "Process")

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true
  if ($SendTest) {
    $env:PAYMENT_ALERT_TEST_ACK = "SEND_ONE_MONITORED_SUPPORT_TEST"
    & npm.cmd run payments:alerts:verify -- --send-test
  } else {
    & npm.cmd run payments:alerts:verify
  }
  if ($LASTEXITCODE -ne 0) { throw "Payment alert transport verification failed." }
} finally {
  if ($locationPushed) {
    Pop-Location
  }
  Remove-Item -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD" -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath "Env:PAYMENT_ALERT_TEST_ACK" -ErrorAction SilentlyContinue
  foreach ($name in $temporaryEnvironmentNames) {
    if ($null -eq $originalEnvironment[$name]) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name], "Process")
    }
  }
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  $plainPassword = $null
  $securePassword = $null
}
