from __future__ import annotations

import json
from pathlib import Path

import streamlit as st

from uh_huh_runtime.runtime import UhHuhRuntime

ROOT = Path(__file__).resolve().parent

SCENARIOS = {
    "Missing owner": {
        "path": ROOT / "data" / "action_missing_recovery_owner.json",
        "description": "Production deploy with no rollback owner, support owner, or rollback plan.",
    },
    "Existing owner": {
        "path": ROOT / "data" / "action_with_recovery_owner.json",
        "description": "Production deploy where recovery ownership evidence already exists.",
    },
    "After-hours low reversibility": {
        "path": ROOT / "data" / "action_after_hours_low_reversibility.json",
        "description": "After-hours production deploy with low reversibility and no recovery owner.",
    },
}


def main() -> None:
    st.set_page_config(page_title="Uh-Huh Runtime V0.1", page_icon="Uh", layout="wide")
    st.title("Uh-Huh Runtime V0.1")
    st.caption("Prototype demo: Recovery Ownership Gap")

    st.markdown(
        "**Core workflow:** control gap detected -> minimum useful question asked -> "
        "evidence supplied -> action allowed."
    )

    scenario_name = st.sidebar.radio("Demo scenario", list(SCENARIOS.keys()))
    scenario = SCENARIOS[scenario_name]
    action_data = load_json(scenario["path"])
    runtime = UhHuhRuntime(ROOT / "data" / "streamlit_audit.jsonl")
    action = runtime.normalize_action(action_data)

    st.sidebar.markdown("### Resolution Inputs")
    st.sidebar.caption("Try the missing-owner scenario, then fill these in.")
    rollback_owner = st.sidebar.text_input("Rollback owner", value="")
    support_owner = st.sidebar.text_input("Support owner", value="")
    rollback_plan = st.sidebar.text_input("Rollback plan", value="")
    resolve_clicked = st.sidebar.button("Resolve gap", type="primary")

    initial = runtime.evaluate(action)
    resolved = runtime.evaluate(
        action,
        supplied_rollback_owner=rollback_owner if resolve_clicked else None,
        supplied_support_owner=support_owner if resolve_clicked else None,
        supplied_rollback_plan=rollback_plan if resolve_clicked else None,
    )

    st.subheader(scenario_name)
    st.write(scenario["description"])

    render_flow(initial, resolved, resolve_clicked)

    left, middle, right = st.columns([1, 1, 1])
    with left:
        render_action(action)
    with middle:
        render_governance_summary(initial)
    with right:
        render_resolution(resolved, resolve_clicked)

    with st.expander("Show technical evaluation"):
        st.json(resolved.to_dict() if resolve_clicked else initial.to_dict())


def render_flow(initial, resolved, resolve_clicked: bool) -> None:
    if resolve_clicked and resolved.final_decision == "allow" and resolved.resolution_status == "resolved":
        st.success("ASK -> RESOLVED -> ALLOW")
        cols = st.columns(3)
        cols[0].metric("1. Initial Decision", initial.final_decision.upper())
        cols[1].metric("2. Gap Status", resolved.resolution_status.upper())
        cols[2].metric("3. Final Decision", resolved.final_decision.upper())
        return

    if initial.final_decision == "allow":
        st.success("ALLOW")
        st.info("Recovery ownership evidence is already present. No question is needed.")
        return

    if initial.final_decision == "ask":
        st.warning("ASK -> waiting for recovery ownership evidence")
    elif initial.final_decision == "confirm":
        st.warning("CONFIRM -> ownership evidence is incomplete")
    else:
        st.error("ESCALATE -> ownership evidence is missing in a higher-friction context")


def render_action(action) -> None:
    st.markdown("### Action")
    st.markdown(f"**Actor:** `{action.actor_id}`")
    st.markdown(f"**Action:** `{action.action_type}`")
    st.markdown(f"**Target:** `{action.target}`")
    st.markdown(f"**Environment:** `{action.environment}`")
    st.markdown(f"**Timestamp:** `{action.timestamp}`")
    st.markdown(f"**Reversibility:** `{action.reversibility}`")


def render_governance_summary(evaluation) -> None:
    st.markdown("### Governance Summary")
    st.markdown(f"**Detected Control Gap:** `{evaluation.detected_gap or 'None'}`")
    st.markdown(f"**Final Decision:** `{evaluation.final_decision}`")

    if evaluation.question_asked:
        st.markdown("**Minimum Useful Question:**")
        st.info(evaluation.question_asked)
    else:
        st.markdown("**Minimum Useful Question:** `Not needed`")

    if evaluation.missing_evidence:
        st.markdown("**Missing Evidence:**")
        for item in evaluation.missing_evidence:
            st.code(item)
    else:
        st.markdown("**Missing Evidence:** `None`")


def render_resolution(evaluation, resolve_clicked: bool) -> None:
    st.markdown("### Resolution")
    if not resolve_clicked:
        st.markdown("Supply rollback owner, support owner, and rollback plan in the sidebar.")
        st.caption("The runtime will re-evaluate immediately after submission.")
        return

    st.markdown(f"**Resolution Status:** `{evaluation.resolution_status}`")
    if evaluation.resolution_evidence:
        st.markdown("**Resolution Evidence:**")
        for item in evaluation.resolution_evidence:
            st.code(item)
    else:
        st.warning("Resolution evidence is still incomplete.")

    if evaluation.final_decision == "allow":
        st.success("Action allowed after resolving the control gap.")
    else:
        st.warning(f"Final decision remains `{evaluation.final_decision}`.")


def load_json(path: Path) -> dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return data


if __name__ == "__main__":
    main()
