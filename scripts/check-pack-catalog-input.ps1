#requires -Version 7.0
# Offline only: no real prompt, Node process, network, database or environment writes.
$ErrorActionPreference = 'Stop'
$runner = Join-Path $PSScriptRoot 'run-pack-catalog-input.ps1'
$tokens = $null
$parseErrors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($runner, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'CHECK_FAILED runner_parse' }
. $runner

function Assert-Check($Condition, [string]$Name) { if (-not $Condition) { throw "CHECK_FAILED $Name" } }
$source = Get-Content -Raw -LiteralPath $runner
Assert-Check ($source.Contains('-AsSecureString')) 'masked_prompt'
Assert-Check (-not $source.Contains('SetEnvironmentVariable')) 'no_parent_environment_mutation'
Assert-Check ($source.Contains('$info.Environment.Clear()')) 'child_environment_cleanup'
Assert-Check ($source.Contains('$child.Kill($true)')) 'owned_child_timeout_cleanup'
Assert-Check ($source.Contains('ZeroFreeBSTR')) 'unmanaged_input_cleanup'
$generic = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'ensure-stripe-live-catalog.mjs')
Assert-Check ($generic.IndexOf('stripe.accounts.retrieveCurrent()') -lt $generic.IndexOf('stripe.products.list(')) 'actual_account_checked_before_catalog_access'

$fakeKey = 'rk' + '_live_' + 'SYNTHETICONLYNOTACREDENTIAL'
$fakeTestKey = 'rk' + '_test_' + 'SYNTHETICONLYNOTACREDENTIAL'
$account = 'acct_1U4I0zCWvUu2WkWQ'
$readInput = { $testState.Reads++; if ($testState.Cancel) { return $null }; ConvertTo-SecureString $testState.Key -AsPlainText -Force }
$getValue = { param($Name) if ($testState.Context.ContainsKey($Name)) { return $testState.Context[$Name] }; return $null }
$runStub = {
    param($Info)
    $testState.Runs++
    $testState.Info = $Info
    $testState.ChildKeyMatches = $Info.Environment['STRIPE_SECRET_KEY'] -ceq $fakeKey
    $testState.ChildAccountMatches = $Info.Environment['PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID'] -ceq $account
    $testState.ChildModeMatches = $Info.Environment['VERCEL_ENV'] -ceq 'production'
    $testState.Arguments = @($Info.ArgumentList)
    $testState.KeyNames = @($Info.Environment.Keys)
    $testState.Hidden = $Info.CreateNoWindow -and -not $Info.UseShellExecute
    $testState.Ack = $Info.Environment[$testState.AckName]
    $testState.SwitchOff = $Info.Environment[$testState.SwitchName] -ceq 'false'
    if ($testState.Throw) { throw $fakeKey }
    return @{ ExitCode = $testState.ExitCode; Output = $testState.Output; Error = $testState.Error }
}
function New-TestState([string]$Prefix = 'EOFY') {
    return @{
        Reads = 0; Runs = 0; Info = $null; Key = $fakeKey; Context = @{}; Cancel = $false; Throw = $false; ExitCode = 0; Error = ''
        Output = "${Prefix}_STRIPE_CATALOG=PENDING product_missing=true price_missing=true checkout=off mutations=none secrets_printed=no"
        AckName = $(if ($Prefix -eq 'EOFY') { 'EOFY_CATALOG_ACK' } else { 'LEAVING_AUSTRALIA_CATALOG_ACK' })
        SwitchName = $(if ($Prefix -eq 'EOFY') { 'EOFY_PRO_PAYMENTS_ENABLED' } else { 'LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED' })
    }
}
function Invoke-Stubbed([string]$Pack = 'eofy', [string]$AccountId = $account, [switch]$Apply, [string]$Ack = '') {
    $output = @(Invoke-PackCatalogInput -Pack $Pack -AccountId $AccountId -Apply:$Apply -ApplyAcknowledgement $Ack -ReadCredential $readInput -GetProcessValue $getValue -RunChild $runStub *>&1)
    Assert-Check ($output.Count -eq 1 -and $output[0] -is [hashtable]) 'no_unexpected_output_stream'
    $result = $output[0]
    Assert-Check (-not (($result.Lines -join "`n").Contains($fakeKey))) 'secret_not_in_output'
    if ($testState.Info) { Assert-Check ($testState.Info.Environment.Count -eq 0) 'child_environment_cleared' }
    return $result
}

foreach ($pair in @(@('eofy', 'EOFY'), @('leaving', 'LEAVING_AUSTRALIA'))) {
    $testState = New-TestState $pair[1]
    $testState.Context['NODE_OPTIONS'] = 'synthetic-preload-not-inherited'
    $testState.Context['UNRELATED_SECRET'] = 'synthetic-not-inherited'
    $result = Invoke-Stubbed -Pack $pair[0]
    Assert-Check ($result.ExitCode -eq 0 -and $testState.Reads -eq 1 -and $testState.Runs -eq 1) 'default_read_only'
    Assert-Check ($testState.ChildKeyMatches -and $testState.ChildAccountMatches -and $testState.ChildModeMatches -and $testState.SwitchOff -and $testState.Hidden) 'pinned_child_context'
    Assert-Check ($testState.Arguments.Count -eq 1 -and $testState.Arguments[0].EndsWith($(if ($pair[0] -eq 'eofy') { 'ensure-eofy-stripe-catalog.mjs' } else { 'ensure-leaving-australia-stripe-catalog.mjs' }))) 'exact_runner_no_apply'
    Assert-Check ('NODE_OPTIONS' -notin $testState.KeyNames -and 'UNRELATED_SECRET' -notin $testState.KeyNames -and $null -eq $testState.Ack) 'minimal_child_environment'
    Assert-Check ($testState.Context['NODE_OPTIONS'] -eq 'synthetic-preload-not-inherited') 'parent_untouched'
}
foreach ($name in @('STRIPE_SECRET_KEY', 'VERCEL_ENV', 'PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID', 'EOFY_PRO_PAYMENTS_ENABLED', 'LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED', 'EOFY_CATALOG_ACK', 'LEAVING_AUSTRALIA_CATALOG_ACK')) {
    $testState = New-TestState
    $testState.Context[$name] = 'synthetic-existing-value'
    $result = Invoke-Stubbed
    Assert-Check ($result.ExitCode -eq 1 -and $testState.Reads -eq 0 -and $testState.Runs -eq 0) 'existing_context_refused_before_prompt'
    Assert-Check ($testState.Context[$name] -ceq 'synthetic-existing-value') 'existing_value_preserved'
}
foreach ($variation in @('account', 'pack', 'ack', 'cancel', 'test-key', 'node-failed', 'stderr', 'secret-stdout', 'unexpected-stdout', 'throw', 'read-reports-write')) {
    $testState = New-TestState
    $params = @{}
    switch ($variation) {
        'account' { $params.AccountId = 'acct_other' }
        'pack' { $params.Pack = 'pay' }
        'ack' { $params.Apply = $true; $params.Ack = 'wrong' }
        'cancel' { $testState.Cancel = $true }
        'test-key' { $testState.Key = $fakeTestKey }
        'node-failed' { $testState.ExitCode = 1; $testState.Error = $fakeKey }
        'stderr' { $testState.Error = $fakeKey }
        'secret-stdout' { $testState.Output = $fakeKey }
        'unexpected-stdout' { $testState.Output = 'untrusted details' }
        'throw' { $testState.Throw = $true }
        'read-reports-write' { $testState.Output = "EOFY_STRIPE_CATALOG=PASS product_created=true price_created=false checkout=off secrets_printed=no`nEOFY_PRODUCT_ID=prod_SYNTHETIC`nEOFY_PRICE_ID=price_SYNTHETIC" }
    }
    $result = Invoke-Stubbed @params
    Assert-Check ($result.ExitCode -ne 0) 'negative_case_refused'
    if ($variation -in @('account', 'pack', 'ack', 'cancel', 'test-key')) { Assert-Check ($testState.Runs -eq 0) 'invalid_input_never_runs_node' }
}
foreach ($pair in @(@('eofy', 'EOFY', 'CREATE_OR_REUSE_EOFY_LIVE_CATALOG_CHECKOUT_OFF'), @('leaving', 'LEAVING_AUSTRALIA', 'CREATE_OR_REUSE_LEAVING_AUSTRALIA_LIVE_CATALOG_CHECKOUT_OFF'))) {
    $testState = New-TestState $pair[1]
    $testState.Output = "$($pair[1])_STRIPE_CATALOG=PASS product_created=true price_created=true checkout=off secrets_printed=no`n$($pair[1])_PRODUCT_ID=prod_SYNTHETIC`n$($pair[1])_PRICE_ID=price_SYNTHETIC"
    $result = Invoke-Stubbed -Pack $pair[0] -Apply -Ack $pair[2]
    Assert-Check ($result.ExitCode -eq 0 -and $result.Lines.Count -eq 3) 'explicit_apply_safe_ids_only'
    Assert-Check ($testState.Arguments.Count -eq 2 -and $testState.Arguments[1] -ceq '--apply' -and $testState.Ack -ceq $pair[2]) 'explicit_apply_flags'
}
Write-Output 'PACK_CATALOG_INPUT_OFFLINE=PASS parsing masked_input child_context cleanup cancellation failures output_allowlist prior_context_preserved node_runs=0 remote_calls=0'
