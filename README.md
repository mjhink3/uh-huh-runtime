# Uh-Huh Runtime V0.1

**Prototype status:** this is a local prototype, not production software. It has a CLI demo and a lightweight Streamlit UI, but no hosted service, no database, and no real integrations. V0.1 exists only to prove the first control-gap workflow.

Uh-Huh Runtime V0.1 is a demo for one control gap:

> **Recovery Ownership Gap:** a consequential production action lacks a named owner for rollback, support, recovery, or remediation.

It proves one product sentence:

> Uh-Huh does not score generic risk. It detects a specific control gap and asks the minimum useful question needed to close it before execution.

## Quickstart

Requirements:

- Python 3.10+
- PowerShell

From this directory:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01
python -m pip install -r requirements.txt
powershell -ExecutionPolicy Bypass -File .\demo.ps1
```

This runs three scenarios.

## Streamlit UI

For a non-technical walkthrough, run:

```powershell
streamlit run app.py
```

The UI presents:

- Action
- Detected Control Gap
- Minimum Useful Question
- Resolution
- Final Decision

It includes the same three demo scenarios:

- Missing owner -> `ask`
- Supplied owner -> `allow`
- Existing owner -> `allow`

### Scenario A: Missing Owner

Command run by `demo.ps1`:

```powershell
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --audit-ledger data/demo_missing_owner_audit.jsonl
```

Expected output:

```json
{
  "decision": "ask",
  "detected_gap": "recovery_ownership_gap",
  "missing_evidence": [
    "rollback_owner",
    "support_owner",
    "rollback_plan"
  ],
  "question_asked": "Who owns rollback and support coverage if this fails?",
  "resolution_status": "unresolved",
  "resolution_evidence": [],
  "final_decision": "ask",
  "rationale": "Production action lacks named rollback or support ownership."
}
```

### Scenario B: Supplied Owner Resolves The Gap

Command run by `demo.ps1`:

```powershell
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --owner jane@example.com --rollback-plan https://runbooks.example.com/payments-api/rollback --audit-ledger data/demo_resolved_owner_audit.jsonl
```

Expected output:

```json
{
  "decision": "allow",
  "detected_gap": null,
  "missing_evidence": [],
  "question_asked": null,
  "resolution_status": "resolved",
  "resolution_evidence": [
    "rollback_owner:jane@example.com",
    "support_owner:jane@example.com",
    "rollback_plan:https://runbooks.example.com/payments-api/rollback"
  ],
  "final_decision": "allow",
  "rationale": "Production action has rollback and support ownership evidence."
}
```

### Scenario C: Existing Owner Allows Immediately

Command run by `demo.ps1`:

```powershell
python -m uh_huh_runtime.cli data/action_with_recovery_owner.json --audit-ledger data/demo_existing_owner_audit.jsonl
```

Expected output:

```json
{
  "decision": "allow",
  "detected_gap": null,
  "missing_evidence": [],
  "question_asked": null,
  "resolution_status": "not_applicable",
  "resolution_evidence": [
    "rollback_owner:jane@example.com",
    "support_owner:sre-oncall",
    "rollback_plan:https://runbooks.example.com/payments-api/rollback"
  ],
  "final_decision": "allow",
  "rationale": "Production action has rollback and support ownership evidence."
}
```

## Audit Logs

The demo writes local JSONL audit ledgers:

```text
data/demo_missing_owner_audit.jsonl
data/demo_resolved_owner_audit.jsonl
data/demo_existing_owner_audit.jsonl
```

Inspect one:

```powershell
Get-Content data/demo_missing_owner_audit.jsonl
```

Each audit record includes:

```json
{
  "action_id": "act_prod_001",
  "actor_id": "release-agent",
  "detected_gap": "recovery_ownership_gap",
  "missing_evidence": ["rollback_owner", "support_owner", "rollback_plan"],
  "question_asked": "Who owns rollback and support coverage if this fails?",
  "resolution_status": "unresolved",
  "resolution_evidence": [],
  "final_decision": "ask",
  "timestamp": "..."
}
```

## Project Structure

```text
app.py          # Streamlit UI demo
uh_huh_runtime/
  cli.py        # command-line entry point
  runtime.py    # detection, intervention selection, audit writing
  models.py     # Action, Evaluation, AuditRecord
data/           # demo actions and audit ledgers
schemas/        # JSON schemas
tests/          # pytest tests
demo.ps1        # one-command demo
```

## Tests

Run:

```powershell
python -m pytest
```

Syntax check:

```powershell
python -m compileall uh_huh_runtime tests
```

## Friendly Error Handling

Bad file:

```powershell
python -m uh_huh_runtime.cli data/does_not_exist.json
```

Expected error:

```text
Uh-Huh input error: file not found: data\does_not_exist.json
```

Missing required field:

```text
Uh-Huh input error: missing required field(s): action_id
```
