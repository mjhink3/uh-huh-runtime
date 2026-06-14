# Uh-Huh Runtime Architecture

## PCIS: Pattern-Control Intervention Selection

Uh-Huh Runtime uses **PCIS: Pattern-Control Intervention Selection** as its underlying evaluation model.

Pattern-Control Intervention Selection is the process of evaluating a proposed action-in-context against known operational failure patterns, identifying the missing control, and selecting the minimum useful intervention before execution proceeds.

PCIS is not a generic risk score. It is a pre-execution judgment loop:

```text
Proposed Action
-> Pattern Match
-> Control Gap
-> Minimum Useful Intervention
-> Evidence
-> Decision
-> Audit Record
```

## V0.2 PCIS Loop

V0.2 implements one pattern and one control gap.

```text
Proposed Action
-> Pattern match: production change with missing recovery ownership
-> Control Gap: Recovery Ownership Gap
-> Intervention: Ask the minimum useful question
-> Evidence: rollback owner, support owner, rollback plan
-> Decision: allow, ask, or escalate
-> Audit Preview
```

## Architectural Roles

**PCIS is the architectural model.**

It defines how Uh-Huh moves from action context to intervention.

**Control Gap is the operational primitive.**

A control gap is the missing, stale, unverified, bypassed, or mis-scoped control that must be resolved before a consequential action proceeds.

**Minimum Useful Question is the user-facing intervention.**

Instead of asking for generic approval, Uh-Huh asks the smallest question that can close the specific control gap.

For V0.2:

```text
Who owns rollback and support coverage if this fails?
```

## Current Implementation

V0.2 includes only the `Recovery Ownership Gap`.

The same PCIS behavior exists in two places:

- Python reference runtime: `uh_huh_runtime/runtime.py`
- TypeScript web demo runtime: `web/lib/runtime.ts`

The duplicated implementations are checked against shared fixtures:

```text
test_scenarios/recovery_ownership_cases.json
```

## Decision Behavior

V0.2 intentionally keeps the decision model small:

```text
non-production action -> allow
production + recovery evidence present -> allow
production + missing recovery evidence -> ask
production + after-hours + low reversibility + missing evidence -> escalate
```

## Future Extension

Future versions can add more operational failure patterns and control gaps through the same PCIS loop.

Examples:

- Change approval gap
- Blast radius gap
- Customer communication gap
- Credential exposure gap
- Data migration verification gap

Each new pattern should define:

- detectable action/context signals
- missing control
- minimum useful question
- required evidence
- decision outcomes
- audit fields
- shared fixture cases

V0.2 does not implement these additional gaps.
