# Uh-Huh Runtime V0.1 Release Notes

Release checkpoint for the first working proof of:

```text
control gap detected -> minimum useful question asked -> evidence supplied -> action allowed
```

## What Works

- CLI prototype for one control gap: `recovery_ownership_gap`.
- Normalizes a proposed action from a local JSON file.
- Detects whether a production deploy lacks rollback/support ownership evidence.
- Returns `ask` when recovery ownership is missing.
- Asks the minimum useful question:

```text
Who owns rollback and support coverage if this fails?
```

- Returns `allow` when recovery ownership evidence already exists.
- Returns `allow` when ownership evidence is supplied through CLI flags.
- Returns `confirm` or `escalate` for after-hours, low-reversibility production actions with unresolved ownership gaps.
- Writes local JSONL audit records with action ID, actor ID, detected gap, missing evidence, question, resolution status, evidence, final decision, and timestamp.
- Includes a one-command PowerShell demo: `demo.ps1`.
- Includes pytest tests covering the working V0.1 behavior.

## Known Limitations

- Prototype only; not production software.
- CLI only; no web UI, service, API server, or database.
- Supports exactly one control gap: `Recovery Ownership Gap`.
- JSON schemas exist, but runtime schema validation is not implemented yet.
- Audit ledger is local JSONL only.
- No authentication, authorization, encryption, or secrets handling.
- No integrations with GitHub, Slack, Jira, PagerDuty, or cloud providers.
- No persistent state beyond local audit files.
- No configurable policies or external rule packs.
- No real approval workflow; `confirm` and `escalate` are returned as decisions only.
- Timestamp parsing for after-hours decisions is intentionally simple.

## Exact Demo Command

Run from:

```powershell
C:\Users\mjhin\uh_huh_runtime_v01
```

Command:

```powershell
powershell -ExecutionPolicy Bypass -File .\demo.ps1
```

Expected demo sequence:

```text
Scenario A: missing owner -> ask
Scenario B: supplied owner -> allow
Scenario C: existing owner -> allow
```

## Exact Local Test Commands

Install test dependencies:

```powershell
python -m pip install -r requirements.txt
```

Run unit tests:

```powershell
python -m pytest
```

Run syntax check:

```powershell
python -m compileall uh_huh_runtime tests
```

## Commit-Ready Summary

Uh-Huh Runtime V0.1 is a small Python CLI prototype that demonstrates control-gap-based governance for one scenario: a production deploy missing recovery ownership. It detects the `Recovery Ownership Gap`, asks the minimum useful question needed to resolve it, accepts supplied ownership evidence, allows the action after resolution, and writes a local audit record.

## Release Hygiene

Commit source files, schemas, tests, demo data, README, roadmap, release notes, and requirements.

Do not commit:

- `.deps/`
- `.testdeps/`
- `__pycache__/`
- `*.pyc`
- generated `data/*audit*.jsonl`
- `.pytest_cache/`
