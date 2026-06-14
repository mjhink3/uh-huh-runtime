# Uh-Huh Runtime V0.1 Demo Script

Target length: 60-90 seconds.

Tone: clear, professional founder voice for a CTO or investor audience.

## Narration

Uh-Huh Runtime is a governance prototype for AI agents before they take consequential actions.

This first version focuses on one control gap: recovery ownership.

The idea is simple. Before an agent deploys to production, Uh-Huh checks whether someone owns rollback and support coverage if the deploy fails.

In the first scenario, the agent proposes a production deploy, but the action has no rollback owner, no support owner, and no rollback plan.

Uh-Huh does not produce a vague risk score. It detects a specific control gap and asks the minimum useful question: who owns rollback and support coverage if this fails?

In the second scenario, we answer that question by supplying an owner and rollback plan.

With the control gap resolved, Uh-Huh allows the action.

In the third scenario, the action already includes recovery ownership evidence, so Uh-Huh allows it immediately.

Every decision writes an audit record: the action, the detected gap, the missing evidence, the question asked, the resolution evidence, and the final decision.

That is the core proof of V0.1: control gap detected, minimum useful question asked, evidence supplied, action allowed.

This is not a full platform yet. It is the smallest working demonstration of Uh-Huh's runtime governance model.
