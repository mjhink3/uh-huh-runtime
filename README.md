# Uh-Huh Runtime

**Prototype status:** Uh-Huh Runtime is a local prototype, not production software. V0.1/V0.2 demonstrate one control gap only: `Recovery Ownership Gap`.

Uh-Huh detects missing operational controls before consequential actions proceed, then asks the minimum useful question needed to resolve the gap.

```text
control gap detected -> minimum useful question asked -> evidence supplied -> action allowed
```

## Evaluation Model: PCIS

Uh-Huh Runtime is built around **PCIS: Pattern-Control Intervention Selection**.

Pattern-Control Intervention Selection is the process of evaluating a proposed action-in-context against known operational failure patterns, identifying the missing control, and selecting the minimum useful intervention before execution proceeds.

In V0.2, PCIS is implemented as a single-pattern loop:

```text
Proposed Action
-> Pattern match: production change with missing recovery ownership
-> Control Gap: Recovery Ownership Gap
-> Intervention: Ask the minimum useful question
-> Evidence: rollback owner, support owner, rollback plan
-> Decision: allow, ask, or escalate
-> Audit Preview
```

- **PCIS** is the architectural model.
- **Control Gap** is the operational primitive.
- **Minimum Useful Question** is the user-facing intervention.
- **V0.2 includes only one control gap.**
- Future versions can add more patterns and gaps through the same PCIS loop.

## What This Repo Contains

- **Python CLI runtime:** the reference prototype.
- **Streamlit app:** legacy non-technical walkthrough.
- **Next.js web console:** the current functional product demo for user testing.
- **Shared test scenarios:** parity fixtures for Python and TypeScript runtime behavior.

## Install Python Dependencies

Run from the repository root:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01
python -m pip install -r requirements.txt
```

## Python CLI Demo

Run the three-scenario CLI demo:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01
powershell -ExecutionPolicy Bypass -File .\demo.ps1
```

The CLI writes local JSONL audit ledgers under `data/`.

## Streamlit Legacy Demo

The Streamlit app is still available, but the Next.js console is now the preferred user-testing surface.

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01
streamlit run app.py
```

## Next.js Web Console

The web console is the current V0.2 demo. It supports:

- the three fixed demo scenarios
- custom action testing
- visible rule trace
- audit preview
- hidden advanced JSON

Install web dependencies once:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd install
```

Run locally in development mode:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Build production assets:

```powershell
npm.cmd run build
```

Run the production build locally:

```powershell
npm.cmd run start
```

Important: `npm.cmd run build` only builds the app. It does not start a server.

## Tests

Python syntax check:

```powershell
python -m compileall app.py uh_huh_runtime tests
```

Python tests:

```powershell
python -m pytest
```

If Windows temp-folder permissions interfere with `tmp_path`, use:

```powershell
python -m pytest --basetemp .deps\pytest-tmp -p no:cacheprovider
```

TypeScript runtime parity:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd run test:runtime
```

Next.js production build:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd run build
```

## Core Control Gap

**Recovery Ownership Gap:** a consequential production action lacks a named owner for rollback, support, recovery, or remediation.

Minimum useful question:

```text
Who owns rollback and support coverage if this fails?
```

## Project Structure

```text
app.py                         # Streamlit legacy demo
demo.ps1                       # CLI demo runner
uh_huh_runtime/
  cli.py                       # CLI entry point
  runtime.py                   # Python detection and audit logic
  models.py                    # Python data models
web/
  app/page.tsx                 # Next.js execution console
  lib/runtime.ts               # TypeScript demo runtime
  scripts/validate-runtime.mjs # TypeScript parity check
docs/
  ARCHITECTURE.md              # PCIS architecture note
test_scenarios/
  recovery_ownership_cases.json
tests/
  test_recovery_ownership_gap.py
```

## Known Limitations

- One control gap only.
- Python and TypeScript runtimes are duplicated and checked by shared fixtures.
- No auth, database, API, external integrations, or model calls.
- Web audit preview is not persisted.
- Timestamp parsing is intentionally simple.
