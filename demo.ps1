$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Uh-Huh Runtime V0.1 Demo"
Write-Host "One control gap: Recovery Ownership Gap"
Write-Host ""

Write-Host "Scenario A: Production deploy with missing recovery owner"
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --audit-ledger data/demo_missing_owner_audit.jsonl
Write-Host ""

Write-Host "Scenario B: Same deploy after user supplies owner"
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --owner jane@example.com --rollback-plan https://runbooks.example.com/payments-api/rollback --audit-ledger data/demo_resolved_owner_audit.jsonl
Write-Host ""

Write-Host "Scenario C: Production deploy with existing recovery owner"
python -m uh_huh_runtime.cli data/action_with_recovery_owner.json --audit-ledger data/demo_existing_owner_audit.jsonl
Write-Host ""

Write-Host "Audit ledgers written:"
Write-Host "  data/demo_missing_owner_audit.jsonl"
Write-Host "  data/demo_resolved_owner_audit.jsonl"
Write-Host "  data/demo_existing_owner_audit.jsonl"
Write-Host ""
