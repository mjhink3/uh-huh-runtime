from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .runtime import UhHuhRuntime

REQUIRED_FIELDS = [
    "action_id",
    "actor_id",
    "action_type",
    "target",
    "environment",
    "timestamp",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Uh-Huh Runtime V0.1 CLI")
    parser.add_argument("action_json", help="Path to an action JSON file.")
    parser.add_argument("--audit-ledger", default="data/audit_ledger.jsonl")
    parser.add_argument("--owner", help="Convenience owner used for both rollback and support coverage.")
    parser.add_argument("--rollback-owner")
    parser.add_argument("--support-owner")
    parser.add_argument("--rollback-plan")
    args = parser.parse_args()

    try:
        data = _load_action_json(Path(args.action_json))
    except FriendlyCliError as error:
        print(f"Uh-Huh input error: {error}", file=sys.stderr)
        raise SystemExit(2) from error

    runtime = UhHuhRuntime(args.audit_ledger)
    try:
        action = runtime.normalize_action(data)
    except (KeyError, TypeError, ValueError) as error:
        print(f"Uh-Huh input error: could not normalize action ({error}).", file=sys.stderr)
        raise SystemExit(2) from error
    rollback_owner = args.rollback_owner or args.owner
    support_owner = args.support_owner or args.owner
    evaluation = runtime.evaluate_and_audit(
        action,
        supplied_rollback_owner=rollback_owner,
        supplied_support_owner=support_owner,
        supplied_rollback_plan=args.rollback_plan,
    )
    print(json.dumps(evaluation.to_dict(), indent=2))


class FriendlyCliError(Exception):
    pass


def _load_action_json(path: Path) -> dict[str, object]:
    if not path.exists():
        raise FriendlyCliError(f"file not found: {path}")
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except json.JSONDecodeError as error:
        raise FriendlyCliError(f"invalid JSON in {path}: {error.msg} at line {error.lineno}") from error
    if not isinstance(data, dict):
        raise FriendlyCliError("action file must contain one JSON object.")
    missing = [
        field
        for field in REQUIRED_FIELDS
        if field not in data or data[field] is None or str(data[field]).strip() == ""
    ]
    if missing:
        raise FriendlyCliError(f"missing required field(s): {', '.join(missing)}")
    return data


if __name__ == "__main__":
    main()
