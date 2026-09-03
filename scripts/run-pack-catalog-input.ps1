#requires -Version 7.0
<#
Manual EOFY/Leaving catalogue input only. Default is a remote read when manually run.
Preparing/testing this file is NOT permission to run it against Stripe or to apply.
No database, Balance Transactions, webhook or Pay operator credentials are needed.
Use an existing approved least-privilege Live restricted key; never put it in arguments.
#>
param(
    [string]$Pack = '',
    [string]$AccountId = '',
    [switch]$Apply,
    [string]$ApplyAcknowledgement = ''
)

function Invoke-PackCatalogInput {
    param(
        [string]$Pack,
        [string]$AccountId,
        [switch]$Apply,
        [string]$ApplyAcknowledgement = '',
        # Internal seams for offline tests; normal entry uses only the defaults.
        [scriptblock]$ReadCredential = { Read-Host 'Approved Live Stripe key (masked; blank cancels)' -AsSecureString },
        [scriptblock]$GetProcessValue = { param($Name) [Environment]::GetEnvironmentVariable($Name, 'Process') },
        [scriptblock]$RunChild = {
            param([Diagnostics.ProcessStartInfo]$Info)
            $child = [Diagnostics.Process]::new()
            $child.StartInfo = $Info
            try {
                if (-not $child.Start()) { throw 'child_start_failed' }
                $outTask = $child.StandardOutput.ReadToEndAsync()
                $errTask = $child.StandardError.ReadToEndAsync()
                if (-not $child.WaitForExit(60000)) {
                    $child.Kill($true)
                    $child.WaitForExit()
                    return @{ ExitCode = 1; Output = ''; Error = '' }
                }
                return @{ ExitCode = $child.ExitCode; Output = $outTask.GetAwaiter().GetResult(); Error = $errTask.GetAwaiter().GetResult() }
            } finally {
                try { if ($child.Id -and -not $child.HasExited) { $child.Kill($true) } } catch { }
                $child.Dispose()
            }
        }
    )
    $secure = $null
    $plain = $null
    $pointer = [IntPtr]::Zero
    $info = $null
    $result = $null
    try {
        if ($AccountId -cne 'acct_1U4I0zCWvUu2WkWQ') { return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=REFUSED reason=account_selection') } }
        $definitions = @{
            eofy = @{ Script = 'ensure-eofy-stripe-catalog.mjs'; Prefix = 'EOFY'; Switch = 'EOFY_PRO_PAYMENTS_ENABLED'; Ack = 'EOFY_CATALOG_ACK'; Confirm = 'CREATE_OR_REUSE_EOFY_LIVE_CATALOG_CHECKOUT_OFF' }
            leaving = @{ Script = 'ensure-leaving-australia-stripe-catalog.mjs'; Prefix = 'LEAVING_AUSTRALIA'; Switch = 'LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED'; Ack = 'LEAVING_AUSTRALIA_CATALOG_ACK'; Confirm = 'CREATE_OR_REUSE_LEAVING_AUSTRALIA_LIVE_CATALOG_CHECKOUT_OFF' }
        }
        if ($Pack -cnotin @('eofy', 'leaving')) { return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=REFUSED reason=pack_selection') } }
        $definition = $definitions[$Pack]
        if (($Apply -and $ApplyAcknowledgement -cne $definition.Confirm) -or (-not $Apply -and $ApplyAcknowledgement)) {
            return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=REFUSED reason=apply_acknowledgement') }
        }
        # Refuse existing context rather than changing/deleting any parent value.
        foreach ($name in @('STRIPE_SECRET_KEY', 'VERCEL_ENV', 'PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID', 'EOFY_PRO_PAYMENTS_ENABLED', 'LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED', 'EOFY_CATALOG_ACK', 'LEAVING_AUSTRALIA_CATALOG_ACK')) {
            if ($null -ne (& $GetProcessValue $name)) { return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=REFUSED reason=existing_process_context') } }
        }
        $secure = & $ReadCredential
        if ($null -eq $secure -or ($secure -is [Security.SecureString] -and $secure.Length -eq 0)) {
            return @{ ExitCode = 2; Lines = @('CATALOG_INPUT=CANCELLED') }
        }
        if ($secure -isnot [Security.SecureString]) { throw 'invalid_input_type' }
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if ($plain -cnotmatch '\A(?:rk|sk)_live_[A-Za-z0-9]{8,}\z') { return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=REFUSED reason=live_key_format') } }
        $node = Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1
        $scriptPath = Join-Path $PSScriptRoot $definition.Script
        if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) { throw 'missing_catalog_script' }
        $info = [Diagnostics.ProcessStartInfo]::new()
        $info.FileName = $node.Source
        $info.WorkingDirectory = Split-Path -Parent $PSScriptRoot
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $info.ArgumentList.Add($scriptPath)
        if ($Apply) { $info.ArgumentList.Add('--apply') }
        # Do not inherit unrelated credentials or Node preload/debug options.
        $info.Environment.Clear()
        foreach ($name in @('SystemRoot', 'WINDIR', 'TEMP', 'TMP')) {
            $value = & $GetProcessValue $name
            if ($null -ne $value) { $info.Environment[$name] = $value }
        }
        $info.Environment['VERCEL_ENV'] = 'production'
        $info.Environment['PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID'] = $AccountId
        $info.Environment[$definition.Switch] = 'false'
        if ($Apply) { $info.Environment[$definition.Ack] = $definition.Confirm }
        $info.Environment['STRIPE_SECRET_KEY'] = $plain
        $result = & $RunChild $info
        # The existing CLI validates the actual account BEFORE listing/mutating products.
        # Its exception stream is not safe to relay (assertions can include supplied values).
        if ($result.ExitCode -ne 0 -or $result.Error -or $result.Output.Length -gt 4096 -or $result.Output.Contains($plain)) { throw 'unverified_child_result' }
        $lines = @($result.Output.Trim() -split '\r?\n')
        $prefix = $definition.Prefix
        $pendingPattern = "\A${prefix}_STRIPE_CATALOG=PENDING product_missing=(?:true|false) price_missing=(?:true|false) checkout=off mutations=none secrets_printed=no\z"
        $passPattern = "\A${prefix}_STRIPE_CATALOG=PASS product_created=(?:true|false) price_created=(?:true|false) checkout=off secrets_printed=no\z"
        $pending = $lines.Count -eq 1 -and $lines[0] -cmatch $pendingPattern
        $passed = $lines.Count -eq 3 -and $lines[0] -cmatch $passPattern -and $lines[1] -cmatch "\A${prefix}_PRODUCT_ID=prod_[A-Za-z0-9]+\z" -and $lines[2] -cmatch "\A${prefix}_PRICE_ID=price_[A-Za-z0-9]+\z"
        if (-not ($pending -or $passed)) { throw 'unverified_output' }
        if ($Apply -and $pending) { throw 'unexpected_pending_apply' }
        if (-not $Apply -and $passed -and $lines[0] -cmatch '(?:product_created|price_created)=true') { throw 'unexpected_mutation_report' }
        return @{ ExitCode = 0; Lines = $lines }
    } catch {
        return @{ ExitCode = 1; Lines = @('CATALOG_INPUT=FAILED reason=unverified_execution raw_output=withheld') }
    } finally {
        if ($null -ne $info) { $info.Environment.Clear() }
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        if ($secure -is [Security.SecureString]) { $secure.Dispose() }
        $plain = $null
        $secure = $null
        $result = $null
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    $outcome = Invoke-PackCatalogInput -Pack $Pack -AccountId $AccountId -Apply:$Apply -ApplyAcknowledgement $ApplyAcknowledgement
    $outcome.Lines | Write-Output
    exit $outcome.ExitCode
}
