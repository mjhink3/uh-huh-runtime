# Uh-Huh Runtime Roadmap

This roadmap preserves V0.1 scope and lists the next focused checkpoints.

## V0.2: Schema Validation

- Validate action JSON against `schemas/action.schema.json` before normalization.
- Validate evaluation and audit outputs against their schemas in tests.
- Add clear validation errors for missing, invalid, or malformed fields.
- Add a CLI validation-only mode.

## V0.3: Second Control Gap

- Add exactly one additional control gap.
- Keep gap definitions explicit and testable.
- Preserve the same flow: detect gap, ask minimum useful question, resolve or escalate, audit.
- Add demo data and tests for the second gap.

## V0.4: GitHub Action Demo

- Package the CLI as a GitHub Action demo.
- Evaluate sample deployment metadata or PR metadata.
- Write audit output as a workflow artifact.
- Keep the action local/demo-safe with no production integrations.

## V0.5: Slack Approval Demo

- Add a demo Slack approval flow.
- Route `confirm` or `escalate` decisions to a Slack approval message.
- Record approval outcome in the audit ledger.
- Keep this as a demo integration, not a full approval platform.
