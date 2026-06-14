# Uh-Huh Runtime V0.1 Demo Storyboard

Target recording length: 60-90 seconds.

Recording tools: OBS, Clipchamp, or Windows Snipping Tool / Screen Recorder.

Voiceover: ElevenLabs using `DEMO_SCRIPT.md`.

## Scene 1: Opening

Screen:

- PowerShell terminal.
- Directory: `C:\Users\mjhin\uh_huh_runtime_v01`.
- Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\demo_recording.ps1
```

Voiceover:

> Uh-Huh Runtime is a governance prototype for AI agents before they take consequential actions.

Visual goal:

- Establish this is a working local demo.
- Show the title header.

## Scene 2: One Control Gap

Screen:

```text
Control Gap Demo: Recovery Ownership Gap
```

Voiceover:

> This first version focuses on one control gap: recovery ownership.

Visual goal:

- Make the concept obvious before JSON appears.

## Scene 3: Scenario A, Missing Owner

Screen:

- Section header: `Scenario A: Production deploy missing recovery ownership`.
- JSON output from the CLI.
- Keep these lines visible:

```json
"decision": "ask"
"detected_gap": "recovery_ownership_gap"
"question_asked": "Who owns rollback and support coverage if this fails?"
```

Voiceover:

> In the first scenario, the agent proposes a production deploy, but the action has no rollback owner, no support owner, and no rollback plan.

> Uh-Huh does not produce a vague risk score. It detects a specific control gap and asks the minimum useful question.

Visual goal:

- This is the main product moment.
- Pause before pressing Enter.

## Scene 4: Scenario B, Evidence Supplied

Screen:

- Section header: `Scenario B: User supplies owner and rollback plan`.
- JSON output showing:

```json
"decision": "allow"
"resolution_status": "resolved"
"final_decision": "allow"
```

Voiceover:

> In the second scenario, we answer that question by supplying an owner and rollback plan.

> With the control gap resolved, Uh-Huh allows the action.

Visual goal:

- Show that the system is not blocking for the sake of blocking.
- It asks, receives evidence, and allows.

## Scene 5: Scenario C, Existing Evidence

Screen:

- Section header: `Scenario C: Existing recovery ownership evidence`.
- JSON output showing:

```json
"decision": "allow"
"detected_gap": null
"final_decision": "allow"
```

Voiceover:

> In the third scenario, the action already includes recovery ownership evidence, so Uh-Huh allows it immediately.

Visual goal:

- Show low-friction behavior.

## Scene 6: Audit Trail

Screen:

- Section header: `Audit ledger`.
- JSONL audit records.
- Show the first record includes:

```json
"detected_gap":"recovery_ownership_gap"
"final_decision":"ask"
```

Voiceover:

> Every decision writes an audit record: the action, the detected gap, the missing evidence, the question asked, the resolution evidence, and the final decision.

Visual goal:

- Prove traceability.

## Scene 7: Closing

Screen:

```text
Core proof:
control gap detected -> question asked -> evidence supplied -> action allowed
```

Voiceover:

> That is the core proof of V0.1: control gap detected, minimum useful question asked, evidence supplied, action allowed.

> This is not a full platform yet. It is the smallest working demonstration of Uh-Huh's runtime governance model.

Visual goal:

- End on the core proof sentence.
