from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal

Decision = Literal["allow", "ask", "confirm", "escalate"]
ResolutionStatus = Literal["not_applicable", "unresolved", "resolved", "escalated"]
Reversibility = Literal["high", "medium", "low"]

RECOVERY_OWNERSHIP_GAP = "recovery_ownership_gap"
RECOVERY_OWNERSHIP_QUESTION = "Who owns rollback and support coverage if this fails?"


@dataclass(frozen=True)
class Action:
    action_id: str
    actor_id: str
    action_type: str
    target: str
    environment: str
    timestamp: str
    rollback_owner: str | None = None
    support_owner: str | None = None
    rollback_plan: str | None = None
    reversibility: Reversibility = "medium"

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Action":
        return cls(
            action_id=data["action_id"],
            actor_id=data["actor_id"],
            action_type=data["action_type"],
            target=data["target"],
            environment=data["environment"],
            timestamp=data["timestamp"],
            rollback_owner=_clean_optional(data.get("rollback_owner")),
            support_owner=_clean_optional(data.get("support_owner")),
            rollback_plan=_clean_optional(data.get("rollback_plan")),
            reversibility=data.get("reversibility", "medium"),
        )

    def with_resolution(
        self,
        rollback_owner: str | None = None,
        support_owner: str | None = None,
        rollback_plan: str | None = None,
    ) -> "Action":
        return Action(
            action_id=self.action_id,
            actor_id=self.actor_id,
            action_type=self.action_type,
            target=self.target,
            environment=self.environment,
            timestamp=self.timestamp,
            rollback_owner=_clean_optional(rollback_owner) or self.rollback_owner,
            support_owner=_clean_optional(support_owner) or self.support_owner,
            rollback_plan=_clean_optional(rollback_plan) or self.rollback_plan,
            reversibility=self.reversibility,
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Evaluation:
    decision: Decision
    detected_gap: str | None
    missing_evidence: list[str]
    question_asked: str | None
    resolution_status: ResolutionStatus
    resolution_evidence: list[str]
    final_decision: Decision
    rationale: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class AuditRecord:
    action_id: str
    actor_id: str
    detected_gap: str | None
    missing_evidence: list[str]
    question_asked: str | None
    resolution_status: ResolutionStatus
    resolution_evidence: list[str]
    final_decision: Decision
    timestamp: str
    action_snapshot: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_evaluation(cls, action: Action, evaluation: Evaluation) -> "AuditRecord":
        return cls(
            action_id=action.action_id,
            actor_id=action.actor_id,
            detected_gap=evaluation.detected_gap,
            missing_evidence=evaluation.missing_evidence,
            question_asked=evaluation.question_asked,
            resolution_status=evaluation.resolution_status,
            resolution_evidence=evaluation.resolution_evidence,
            final_decision=evaluation.final_decision,
            timestamp=datetime.now(timezone.utc).isoformat(),
            action_snapshot=action.to_dict(),
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _clean_optional(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
