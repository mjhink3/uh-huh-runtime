# Uh-Huh Runtime V0.1 Demo Commands

Use PowerShell from the project directory:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01
```

Recommended recording command:

```powershell
powershell -ExecutionPolicy Bypass -File .\demo_recording.ps1
```

## Pacing Notes

- Start recording with the terminal already open.
- Use a large terminal font.
- Keep the project directory visible in the prompt if possible.
- Pause for 3-5 seconds after each section so the viewer can read the key fields.
- The recording script pauses between sections. Press Enter to continue.

## Optional Setup Check

Run this before recording, not during the final take:

```powershell
python -m compileall uh_huh_runtime tests
```

Expected output includes:

```text
Listing 'uh_huh_runtime'...
Listing 'tests'...
```

## Recording Flow

### 1. Start Clean Demo

Command:

```powershell
powershell -ExecutionPolicy Bypass -File .\demo_recording.ps1
```

Expected first screen:

```text
Uh-Huh Runtime V0.1
Control Gap Demo: Recovery Ownership Gap
```

### 2. Scenario A: Missing Owner

The script runs:

```powershell
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --audit-ledger data/recording_audit.jsonl
```

Expected key fields:

```json
"decision": "ask"
"detected_gap": "recovery_ownership_gap"
"question_asked": "Who owns rollback and support coverage if this fails?"
"final_decision": "ask"
```

Pause 4-5 seconds.

### 3. Scenario B: Supplied Owner

The script runs:

```powershell
python -m uh_huh_runtime.cli data/action_missing_recovery_owner.json --owner jane@example.com --rollback-plan https://runbooks.example.com/payments-api/rollback --audit-ledger data/recording_audit.jsonl
```

Expected key fields:

```json
"decision": "allow"
"resolution_status": "resolved"
"final_decision": "allow"
```

Pause 3-4 seconds.

### 4. Scenario C: Existing Owner

The script runs:

```powershell
python -m uh_huh_runtime.cli data/action_with_recovery_owner.json --audit-ledger data/recording_audit.jsonl
```

Expected key fields:

```json
"decision": "allow"
"detected_gap": null
"final_decision": "allow"
```

Pause 3-4 seconds.

### 5. Audit Ledger

The script runs:

```powershell
Get-Content data/recording_audit.jsonl
```

Expected result:

- Three JSONL audit records.
- First record has `detected_gap` set to `recovery_ownership_gap`.
- Second record has `resolution_status` set to `resolved`.
- Third record has `final_decision` set to `allow`.

## Cleanup After Recording

The recording script writes:

```text
data/recording_audit.jsonl
```

This file is ignored by `.gitignore`.
