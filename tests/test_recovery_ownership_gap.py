from __future__ import annotations

import json
from pathlib import Path

from uh_huh_runtime.models import RECOVERY_OWNERSHIP_GAP, RECOVERY_OWNERSHIP_QUESTION, Action
from uh_huh_runtime.runtime import UhHuhRuntime


def make_action(**overrides: object) -> Action:
    data = {
        "action_id": "act_001",
        "actor_id": "release-agent",
        "action_type": "deploy",
        "target": "payments-api",
        "environment": "production",
        "timestamp": "2026-06-14T10:15:00-07:00",
        "rollback_owner": None,
        "support_owner": None,
        "rollback_plan": None,
        "reversibility": "medium",
    }
    data.update(overrides)
    return Action.from_dict(data)


def test_non_production_allows_without_recovery_owner() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(make_action(environment="staging"))

    assert result.final_decision == "allow"
    assert result.detected_gap is None
    assert result.question_asked is None


def test_production_with_recovery_ownership_allows() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(
        make_action(
            rollback_owner="jane@example.com",
            support_owner="sre-oncall",
            rollback_plan="https://runbooks.example.com/payments-api/rollback",
        )
    )

    assert result.final_decision == "allow"
    assert result.detected_gap is None
    assert result.resolution_evidence == [
        "rollback_owner:jane@example.com",
        "support_owner:sre-oncall",
        "rollback_plan:https://runbooks.example.com/payments-api/rollback",
    ]


def test_production_missing_owners_asks_minimum_question() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(make_action())

    assert result.final_decision == "ask"
    assert result.detected_gap == RECOVERY_OWNERSHIP_GAP
    assert result.missing_evidence == ["rollback_owner", "support_owner", "rollback_plan"]
    assert result.question_asked == RECOVERY_OWNERSHIP_QUESTION


def test_after_hours_low_reversibility_missing_one_owner_requires_confirmation() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(
        make_action(
            timestamp="2026-06-14T18:15:00-07:00",
            reversibility="low",
            rollback_owner="jane@example.com",
            support_owner=None,
        )
    )

    assert result.final_decision == "confirm"
    assert result.detected_gap == RECOVERY_OWNERSHIP_GAP
    assert result.missing_evidence == ["support_owner", "rollback_plan"]


def test_after_hours_low_reversibility_missing_both_owners_escalates() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(
        make_action(timestamp="2026-06-14T18:15:00-07:00", reversibility="low")
    )

    assert result.final_decision == "escalate"
    assert result.resolution_status == "escalated"
    assert result.detected_gap == RECOVERY_OWNERSHIP_GAP


def test_supplied_owner_resolves_gap_and_allows() -> None:
    runtime = UhHuhRuntime()
    result = runtime.evaluate(
        make_action(),
        supplied_rollback_owner="jane@example.com",
        supplied_support_owner="sre-oncall",
        supplied_rollback_plan="https://runbooks.example.com/payments-api/rollback",
    )

    assert result.final_decision == "allow"
    assert result.resolution_status == "resolved"
    assert result.detected_gap is None
    assert "rollback_owner:jane@example.com" in result.resolution_evidence
    assert "support_owner:sre-oncall" in result.resolution_evidence


def test_audit_ledger_records_required_fields(tmp_path: Path) -> None:
    ledger = tmp_path / "audit_ledger.jsonl"
    runtime = UhHuhRuntime(ledger)
    result = runtime.evaluate_and_audit(make_action())

    assert result.final_decision == "ask"
    record = json.loads(ledger.read_text(encoding="utf-8").strip())
    assert record["action_id"] == "act_001"
    assert record["actor_id"] == "release-agent"
    assert record["detected_gap"] == RECOVERY_OWNERSHIP_GAP
    assert record["missing_evidence"] == ["rollback_owner", "support_owner", "rollback_plan"]
    assert record["question_asked"] == RECOVERY_OWNERSHIP_QUESTION
    assert record["resolution_status"] == "unresolved"
    assert record["resolution_evidence"] == []
    assert record["final_decision"] == "ask"
    assert record["timestamp"]


def test_demo_readiness_flow(tmp_path: Path) -> None:
    ledger = tmp_path / "demo_audit.jsonl"
    runtime = UhHuhRuntime(ledger)

    missing_owner = make_action(action_id="act_missing")
    supplied_owner = make_action(action_id="act_supplied")
    existing_owner = make_action(
        action_id="act_existing",
        rollback_owner="jane@example.com",
        support_owner="sre-oncall",
        rollback_plan="https://runbooks.example.com/payments-api/rollback",
    )

    missing_result = runtime.evaluate_and_audit(missing_owner)
    supplied_result = runtime.evaluate_and_audit(
        supplied_owner,
        supplied_rollback_owner="jane@example.com",
        supplied_support_owner="jane@example.com",
        supplied_rollback_plan="https://runbooks.example.com/payments-api/rollback",
    )
    existing_result = runtime.evaluate_and_audit(existing_owner)

    assert missing_result.final_decision == "ask"
    assert missing_result.detected_gap == RECOVERY_OWNERSHIP_GAP
    assert supplied_result.final_decision == "allow"
    assert supplied_result.resolution_status == "resolved"
    assert existing_result.final_decision == "allow"

    records = [
        json.loads(line)
        for line in ledger.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    assert len(records) == 3
    assert records[0]["final_decision"] == "ask"
    assert records[1]["final_decision"] == "allow"
    assert records[2]["final_decision"] == "allow"
