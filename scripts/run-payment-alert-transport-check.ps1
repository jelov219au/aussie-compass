param(
  [switch]$SendTest,
  [string]$SmtpHost = "smtppro.zoho.com",
  [int]$SmtpPort = 465
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not $SmtpHost -or $SmtpHost -match '\s' -or $SmtpPort -lt 1 -or $SmtpPort -gt 65535) {
  throw "Use the exact Zoho SMTP host and a valid port."
}

$securePassword = Read-Host "Zoho payment-alert app password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

if (-not $plainPassword) {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  throw "The Zoho app password is required."
}

Push-Location -LiteralPath $projectRoot
try {
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

  if ($SendTest) {
    $env:PAYMENT_ALERT_TEST_ACK = "SEND_ONE_MONITORED_SUPPORT_TEST"
    & npm.cmd run payments:alerts:verify -- --send-test
  } else {
    & npm.cmd run payments:alerts:verify
  }
  if ($LASTEXITCODE -ne 0) { throw "Payment alert transport verification failed." }
} finally {
  Pop-Location
  foreach ($name in @(
    "VERCEL_ENV",
    "PAYMENTS_ENABLED",
    "PAYMENT_ALERTS_ENABLED",
    "PAYMENT_ALERT_TO_EMAIL",
    "PAYMENT_ALERT_FROM_EMAIL",
    "NEXT_PUBLIC_SUPPORT_EMAIL",
    "ZOHO_SMTP_HOST",
    "ZOHO_SMTP_PORT",
    "ZOHO_SMTP_USER",
    "ZOHO_SMTP_APP_PASSWORD",
    "PAYMENT_ALERT_TEST_ACK"
  )) {
    Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
  }
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  $plainPassword = $null
  $securePassword = $null
}
