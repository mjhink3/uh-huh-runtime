from __future__ import annotations

import json
from pathlib import Path

import streamlit as st

from uh_huh_runtime.runtime import UhHuhRuntime

ROOT = Path(__file__).resolve().parent

SCENARIOS = {
    "Recovery Ownership Gap": {
        "path": ROOT / "data" / "action_missing_recovery_owner.json",
        "title": "Production Deploy Without Recovery Ownership",
        "summary": "A production deployment is proposed without rollback ownership, support ownership, or a rollback plan.",
    },
    "Ownership Evidence Present": {
        "path": ROOT / "data" / "action_with_recovery_owner.json",
        "title": "Production Deploy With Required Controls",
        "summary": "A production deployment already includes the required recovery ownership controls.",
    },
    "After-Hours Production Change": {
        "path": ROOT / "data" / "action_after_hours_low_reversibility.json",
        "title": "After-Hours Low-Reversibility Production Deploy",
        "summary": "An after-hours production deployment is proposed with low reversibility and missing recovery ownership evidence.",
    },
}

CONTROL_LABELS = {
    "rollback_owner": "Rollback owner",
    "support_owner": "Support owner",
    "rollback_plan": "Rollback plan",
}


def main() -> None:
    st.set_page_config(page_title="Uh-Huh Runtime V0.1", page_icon="UH", layout="wide")
    inject_css()

    runtime = UhHuhRuntime(ROOT / "data" / "streamlit_audit.jsonl")
    scenario_name, action, scenario = render_sidebar(runtime)

    initial = runtime.evaluate(action)
    resolution = st.session_state.get("resolution", {})
    has_resolution = any(str(value).strip() for value in resolution.values())
    active = runtime.evaluate(action, **resolution) if has_resolution else initial

    render_hero()
    render_status_banner(initial, active, has_resolution)
    render_flow(active)

    st.markdown(f"### {scenario['title']}")
    st.caption(scenario["summary"])

    left, center, right = st.columns([0.95, 1.25, 0.95])
    with left:
        render_action_card(action)
        render_control_gap_card(active)
    with center:
        render_question_card(active)
    with right:
        render_evidence_card(active, has_resolution)
        render_decision_card(active, has_resolution)

    with st.expander("Advanced"):
        st.caption("Technical evaluation returned by UhHuhRuntime.evaluate().")
        st.json(active.to_dict())

    st.caption(f"Scenario selected: {scenario_name}. Runtime logic is unchanged.")


def render_sidebar(runtime: UhHuhRuntime):
    st.sidebar.title("Uh-Huh Runtime")
    st.sidebar.caption("V0.1 control-gap resolution demo")
    scenario_name = st.sidebar.radio("Scenario", list(SCENARIOS.keys()))
    scenario = SCENARIOS[scenario_name]
    action = runtime.normalize_action(load_json(scenario["path"]))

    st.sidebar.divider()
    st.sidebar.subheader("Evidence")
    st.sidebar.caption("Supply the required controls to resolve the gap.")

    with st.sidebar.form("resolution_form", clear_on_submit=False):
        rollback_owner = st.text_input("Rollback owner", value=st.session_state.get("rollback_owner", ""))
        support_owner = st.text_input("Support owner", value=st.session_state.get("support_owner", ""))
        rollback_plan = st.text_input("Rollback plan", value=st.session_state.get("rollback_plan", ""))
        submitted = st.form_submit_button("Resolve control gap", type="primary")

    if submitted:
        st.session_state["rollback_owner"] = rollback_owner
        st.session_state["support_owner"] = support_owner
        st.session_state["rollback_plan"] = rollback_plan
        st.session_state["resolution"] = {
            "supplied_rollback_owner": rollback_owner or None,
            "supplied_support_owner": support_owner or None,
            "supplied_rollback_plan": rollback_plan or None,
        }

    if st.sidebar.button("Clear supplied evidence"):
        for key in ("rollback_owner", "support_owner", "rollback_plan", "resolution"):
            st.session_state.pop(key, None)
        st.rerun()

    st.sidebar.divider()
    st.sidebar.caption("The UI does not implement governance rules. It only calls the existing runtime.")
    return scenario_name, action, scenario


def render_hero() -> None:
    st.title("Before an AI agent acts, what control is missing?")
    st.markdown(
        "Uh-Huh detects missing operational controls and asks the minimum useful question "
        "before execution proceeds."
    )


def render_status_banner(initial, active, has_resolution: bool) -> None:
    if has_resolution and active.final_decision == "allow" and active.resolution_status == "resolved":
        st.success(
            "Gap Resolved\n\n"
            "Rollback ownership, support ownership, and rollback plan have been provided. Action may proceed."
        )
        return

    if initial.final_decision == "allow" and active.resolution_status == "not_applicable":
        st.success(
            "Required Controls Present\n\n"
            "This production deployment includes recovery ownership evidence. Action may proceed."
        )
        return

    if active.final_decision == "escalate":
        st.error(
            "Escalation Required\n\n"
            "This action is after-hours, low-reversibility, and missing recovery ownership evidence."
        )
        return

    if active.final_decision == "ask":
        st.warning(
            "Control Gap Detected\n\n"
            "This production deployment cannot proceed because required recovery controls have not been provided."
        )
        return

    st.warning(
        "Review Required\n\n"
        "Required recovery ownership controls are incomplete. Supply evidence or escalate to the accountable owner."
    )


def render_flow(evaluation) -> None:
    evidence_state = "Provided" if evaluation.resolution_evidence else "Needed"
    if evaluation.resolution_status == "not_applicable":
        evidence_state = "Present"

    step_cols = st.columns(5)
    step_cols[0].metric("Action", "Proposed")
    step_cols[1].metric("Control Gap", "Detected" if evaluation.detected_gap else "Clear")
    step_cols[2].metric("Question", "Asked" if evaluation.question_asked else "Not needed")
    step_cols[3].metric("Evidence", evidence_state)
    step_cols[4].metric("Decision", evaluation.final_decision.upper())


def render_action_card(action) -> None:
    with st.container(border=True):
        st.subheader("Proposed Action")
        st.caption("What the agent wants to execute.")
        field("Actor", action.actor_id)
        field("Action", action.action_type)
        field("Target", action.target)
        field("Environment", action.environment)
        field("Reversibility", action.reversibility)


def render_control_gap_card(evaluation) -> None:
    with st.container(border=True):
        st.subheader("Control Gap")
        st.caption("The missing operational control.")
        field("Detected", evaluation.detected_gap or "None")

        if evaluation.missing_evidence:
            st.markdown("**Missing required controls**")
            for item in evaluation.missing_evidence:
                st.warning(CONTROL_LABELS.get(item, item), icon="!")
        else:
            st.success("No missing required controls")


def render_question_card(evaluation) -> None:
    with st.container(border=True):
        st.subheader("Minimum Useful Question")
        st.caption("The smallest question needed to close the control gap.")
        if evaluation.question_asked:
            st.info(evaluation.question_asked)
            st.markdown(
                "This question asks for the exact operational controls needed before execution can proceed."
            )
        else:
            st.success("No question needed. Required controls are already present.")


def render_evidence_card(evaluation, has_resolution: bool) -> None:
    with st.container(border=True):
        st.subheader("Evidence Required")
        st.caption("What must be supplied to proceed.")

        if evaluation.resolution_evidence:
            for item in evaluation.resolution_evidence:
                st.success(format_evidence(item))
        elif has_resolution:
            st.warning("Evidence is incomplete.")
            for item in evaluation.missing_evidence:
                st.warning(f"Still missing: {CONTROL_LABELS.get(item, item)}", icon="!")
        elif evaluation.missing_evidence:
            for item in evaluation.missing_evidence:
                st.caption(CONTROL_LABELS.get(item, item))
        else:
            st.success("Required evidence is already present.")


def render_decision_card(evaluation, has_resolution: bool) -> None:
    with st.container(border=True):
        st.subheader("Decision")
        st.caption("Minimum useful intervention selected by the runtime.")

        if evaluation.final_decision == "allow":
            st.success("ALLOW")
        elif evaluation.final_decision == "escalate":
            st.error("ESCALATE")
        else:
            st.warning(evaluation.final_decision.upper())

        field("Resolution status", evaluation.resolution_status)
        st.caption(evaluation.rationale)

        if has_resolution and evaluation.final_decision == "allow":
            st.success("ASK -> RESOLVED -> ALLOW")


def field(label: str, value: object) -> None:
    label_col, value_col = st.columns([0.4, 0.6])
    label_col.caption(label)
    value_col.markdown(f"`{value}`")


def format_evidence(item: str) -> str:
    key, _, value = item.partition(":")
    label = CONTROL_LABELS.get(key, key.replace("_", " ").title())
    return f"{label}: {value}"


def load_json(path: Path) -> dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return data


def inject_css() -> None:
    st.markdown(
        """
        <style>
        .stApp {
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 34rem),
            linear-gradient(180deg, #070b14 0%, #0b1020 100%);
        }

        [data-testid="stSidebar"] {
          background: #080c16;
          border-right: 1px solid #263247;
        }

        .block-container {
          padding-top: 2.25rem;
          padding-bottom: 3rem;
          max-width: 1240px;
        }

        h1 {
          max-width: 820px;
          letter-spacing: 0;
          line-height: 1.05;
        }

        h2, h3 {
          letter-spacing: 0;
        }

        [data-testid="stMetric"] {
          background: rgba(17, 24, 39, 0.72);
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 14px;
          padding: 0.9rem;
        }

        [data-testid="stVerticalBlockBorderWrapper"] {
          background: rgba(17, 24, 39, 0.82);
          border-color: rgba(125, 211, 252, 0.20);
          border-radius: 14px;
        }

        div[data-testid="stAlert"] {
          border-radius: 12px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
