# Uh-Huh Runtime Roadmap

This roadmap preserves the current PCIS model:

```text
Pattern -> Control Gap -> Minimum Useful Question -> Evidence -> Decision -> Audit
```

PCIS means **Pattern-Control Intervention Selection**. It is the architectural model for Uh-Huh Runtime. Control gaps are the operational primitive, and minimum useful questions are the user-facing intervention.

## V0.2: Functional Testable Console

- Document PCIS as the evaluation model.
- Add shared recovery ownership scenario fixtures.
- Verify Python and TypeScript runtime parity against the same cases.
- Add custom action testing in the Next.js console.
- Add visible deterministic rule trace.
- Add compact audit preview.
- Clarify draft action versus last evaluated result.
- Add visible timestamp validation warnings.
- Update setup, build, run, and deployment documentation.

## V0.3: Second Control Gap

- Add exactly one additional control gap.
- Add it through the same PCIS loop: pattern match, control gap, question, evidence, decision, audit.
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
