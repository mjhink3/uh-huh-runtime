# Uh-Huh Runtime

Detects operational control gaps before consequential AI-agent actions and applies the minimum useful intervention needed to resolve them.

## What It Is

Uh-Huh Runtime is a prototype pre-execution control plane for AI agents.

Rather than scoring generic risk, Uh-Huh identifies missing operational controls ("control gaps") before consequential actions proceed.

When a gap is detected, Uh-Huh applies the minimum useful intervention needed to resolve it.

## Current Prototype

V0.1 implements:

- Recovery Ownership Gap
- Ask → Resolve → Allow workflow
- Audit logging
- CLI interface

## Example

Action:

Deploy payments API to production

Detected gap:

Recovery Ownership Gap

Question:

Who owns rollback and support coverage if this fails?

Result:

Action proceeds once ownership evidence is supplied.

## Quick Start
