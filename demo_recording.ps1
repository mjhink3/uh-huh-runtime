$ErrorActionPreference = "Stop"

function Pause-ForRecording {
    param([string]$Message = "Press Enter to continue...")
    Write-Host ""
    Read-Host $Message | Out-Null
    Clear-Host
}

$auditPath = "data/recording_audit.jsonl"
if (Test-Path -LiteralPath $auditPath) {
    Remove-Item -LiteralPath $auditPath -Force
}

Clear-Host
Write-Host "Uh-Huh Runtime V0.1"
Write-Host "Control Gap Demo: Recovery Ownership Gap"
Write-Host ""
Write-Host "Core proof:"
Write-Host "control gap detected -> question asked -> evidence supplied -> action allowed"
Pause-ForRecording

Write-Host "Scenario A: Production deploy missing recovery ownership"
Write-Host ""
Write-Host "Running: production deploy with no rollback owner, no support owner, no rollback plan"
Write-Host ""
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --audit-ledger $auditPath
Pause-ForRecording

Write-Host "Scenario B: User supplies owner and rollback plan"
Write-Host ""
Write-Host "Running: same deploy, now with ownership evidence"
Write-Host ""
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --owner jane@example.com --rollback-plan https://runbooks.example.com/payments-api/rollback --audit-ledger $auditPath
Pause-ForRecording

Write-Host "Scenario C: Existing recovery ownership evidence"
Write-Host ""
Write-Host "Running: production deploy where rollback/support ownership already exists"
Write-Host ""
python -m uh_huh_runtime.cli data/action_with_recovery_owner.json --audit-ledger $auditPath
Pause-ForRecording

Write-Host "Audit ledger"
Write-Host ""
Write-Host "Running: Get-Content $auditPath"
Write-Host ""
Get-Content $auditPath
Pause-ForRecording

Write-Host "Core proof"
Write-Host ""
Write-Host "control gap detected -> minimum useful question asked -> evidence supplied -> action allowed"
Write-Host ""
Write-Host "Demo complete."
