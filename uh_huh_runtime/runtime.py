from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import (
    RECOVERY_OWNERSHIP_GAP,
    RECOVERY_OWNERSHIP_QUESTION,
    Action,
    AuditRecord,
    Evaluation,
)


class UhHuhRuntime:
    """Runtime V0.1: detects and resolves the Recovery Ownership Gap."""

    def __init__(self, audit_ledger_path: str | Path = "audit_ledger.jsonl"):
        self.audit_ledger_path = Path(audit_ledger_path)

    def normalize_action(self, data: dict[str, Any]) -> Action:
        return Action.from_dict(data)

    def evaluate(
        self,
        action: Action,
        supplied_rollback_owner: str | None = None,
        supplied_support_owner: str | None = None,
        supplied_rollback_plan: str | None = None,
    ) -> Evaluation:
        resolved_action = action.with_resolution(
            rollback_owner=supplied_rollback_owner,
            support_owner=supplied_support_owner,
            rollback_plan=supplied_rollback_plan,
        )

        if not _is_production(resolved_action):
            return Evaluation(
                decision="allow",
                detected_gap=None,
                missing_evidence=[],
                question_asked=None,
                resolution_status="not_applicable",
                resolution_evidence=[],
                final_decision="allow",
                rationale="Action is not production; Recovery Ownership Gap does not apply.",
            )

        missing = self.detect_recovery_ownership_gap(resolved_action)
        if not missing:
            return Evaluation(
                decision="allow",
                detected_gap=None,
                missing_evidence=[],
                question_asked=None,
                resolution_status="resolved" if _has_resolution_input(action, resolved_action) else "not_applicable",
                resolution_evidence=self._resolution_evidence(resolved_action),
                final_decision="allow",
                rationale="Production action has rollback and support ownership evidence.",
            )

        if _has_resolution_input(action, resolved_action):
            return Evaluation(
                decision="ask",
                detected_gap=RECOVERY_OWNERSHIP_GAP,
                missing_evidence=missing,
                question_asked=RECOVERY_OWNERSHIP_QUESTION,
                resolution_status="unresolved",
                resolution_evidence=self._resolution_evidence(resolved_action),
                final_decision=self._unresolved_production_decision(resolved_action, missing),
                rationale="Resolution input was supplied, but required ownership evidence is still missing.",
            )

        decision = self._unresolved_production_decision(resolved_action, missing)
        return Evaluation(
            decision=decision,
            detected_gap=RECOVERY_OWNERSHIP_GAP,
            missing_evidence=missing,
            question_asked=RECOVERY_OWNERSHIP_QUESTION,
            resolution_status="escalated" if decision == "escalate" else "unresolved",
            resolution_evidence=[],
            final_decision=decision,
            rationale="Production action lacks named rollback or support ownership.",
        )

    def evaluate_and_audit(
        self,
        action: Action,
        supplied_rollback_owner: str | None = None,
        supplied_support_owner: str | None = None,
        supplied_rollback_plan: str | None = None,
    ) -> Evaluation:
        resolved_action = action.with_resolution(
            rollback_owner=supplied_rollback_owner,
            support_owner=supplied_support_owner,
            rollback_plan=supplied_rollback_plan,
        )
        evaluation = self.evaluate(
            action,
            supplied_rollback_owner=supplied_rollback_owner,
            supplied_support_owner=supplied_support_owner,
            supplied_rollback_plan=supplied_rollback_plan,
        )
        audited_action = resolved_action if evaluation.final_decision == "allow" else action
        self.append_audit(AuditRecord.from_evaluation(audited_action, evaluation))
        return evaluation

    def detect_recovery_ownership_gap(self, action: Action) -> list[str]:
        missing: list[str] = []
        if not action.rollback_owner:
            missing.append("rollback_owner")
        if not action.support_owner:
            missing.append("support_owner")
        if not action.rollback_plan:
            missing.append("rollback_plan")
        owner_missing = "rollback_owner" in missing or "support_owner" in missing
        return missing if owner_missing else []

    def append_audit(self, record: AuditRecord) -> None:
        self.audit_ledger_path.parent.mkdir(parents=True, exist_ok=True)
        with self.audit_ledger_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record.to_dict(), sort_keys=True) + "\n")

    def _unresolved_production_decision(self, action: Action, missing: list[str]) -> str:
        if _is_after_hours(action) and action.reversibility == "low":
            if "rollback_owner" in missing and "support_owner" in missing:
                return "escalate"
            return "confirm"
        return "ask"

    def _resolution_evidence(self, action: Action) -> list[str]:
        evidence: list[str] = []
        if action.rollback_owner:
            evidence.append(f"rollback_owner:{action.rollback_owner}")
        if action.support_owner:
            evidence.append(f"support_owner:{action.support_owner}")
        if action.rollback_plan:
            evidence.append(f"rollback_plan:{action.rollback_plan}")
        return evidence


def _is_production(action: Action) -> bool:
    return action.environment.strip().lower() in {"prod", "production"}


def _is_after_hours(action: Action) -> bool:
    try:
        hour = int(action.timestamp.split("T", maxsplit=1)[1][0:2])
    except (IndexError, ValueError):
        return False
    return hour < 8 or hour >= 17


def _has_resolution_input(original: Action, resolved: Action) -> bool:
    return (
        original.rollback_owner != resolved.rollback_owner
        or original.support_owner != resolved.support_owner
        or original.rollback_plan != resolved.rollback_plan
    )
