from __future__ import annotations

import json
from pathlib import Path
from typing import Any

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
    st.set_page_config(page_title="Uh-Huh Runtime V0.1", page_icon="✓", layout="wide")
    inject_css()

    runtime = UhHuhRuntime(ROOT / "data" / "streamlit_audit.jsonl")
    scenario_name, action, scenario = render_sidebar(runtime)

    initial = runtime.evaluate(action)
    resolution = st.session_state.get("resolution", {})
    has_resolution = any(str(value).strip() for value in resolution.values())
    active = runtime.evaluate(action, **resolution) if has_resolution else initial

    render_header()
    render_status_banner(initial, active, has_resolution)
    render_step_indicator(active, has_resolution)

    st.markdown(f"### {scenario['title']}")
    st.caption(scenario["summary"])

    action_col, gap_col = st.columns([1.05, 1])
    with action_col:
        render_action_card(action)
    with gap_col:
        render_control_gap_card(active)

    evidence_col, decision_col = st.columns([1.05, 1])
    with evidence_col:
        render_evidence_card(active, has_resolution)
    with decision_col:
        render_decision_card(active, has_resolution)

    with st.expander("Advanced / debug: technical evaluation"):
        st.json(active.to_dict())

    st.caption(f"Scenario selected: {scenario_name}. Runtime logic: UhHuhRuntime.evaluate().")


def render_sidebar(runtime: UhHuhRuntime):
    st.sidebar.markdown("## Uh-Huh Runtime")
    st.sidebar.caption("V0.1 control-gap resolution demo")
    scenario_name = st.sidebar.radio("Scenario", list(SCENARIOS.keys()))
    scenario = SCENARIOS[scenario_name]
    action = runtime.normalize_action(load_json(scenario["path"]))

    st.sidebar.markdown("---")
    st.sidebar.markdown("### Supply Required Controls")
    st.sidebar.caption("Resolve the gap by providing recovery ownership evidence.")

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

    st.sidebar.markdown("---")
    st.sidebar.caption("No runtime rules are implemented in the UI. The app only calls the existing backend.")
    return scenario_name, action, scenario


def render_header() -> None:
    st.markdown(
        """
        <div class="hero">
          <div>
            <div class="eyebrow">Runtime control-gap resolution</div>
            <h1>Uh-Huh Runtime V0.1</h1>
            <p>Detect the missing operational control before an AI agent executes a consequential action.</p>
          </div>
          <div class="hero-proof">Action → Control Gap → Question → Evidence → Decision</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_status_banner(initial, active, has_resolution: bool) -> None:
    if has_resolution and active.final_decision == "allow" and active.resolution_status == "resolved":
        status_card(
            "success",
            "✓ Gap Resolved",
            "Rollback ownership, support ownership, and rollback plan have been provided. Action may proceed.",
        )
        return

    if initial.final_decision == "allow" and active.resolution_status == "not_applicable":
        status_card(
            "success",
            "✓ Required Controls Present",
            "This production deployment includes recovery ownership evidence. Action may proceed.",
        )
        return

    if active.final_decision == "escalate":
        status_card(
            "danger",
            "Escalation Required",
            "This action is after-hours, low-reversibility, and missing recovery ownership evidence.",
        )
        return

    if active.final_decision == "ask":
        status_card(
            "warning",
            "⚠ Recovery Ownership Gap Detected",
            "This production deployment cannot proceed because no rollback owner, support owner, or rollback plan has been provided.",
        )
        return

    status_card(
        "warning",
        "Review Required",
        "Required recovery ownership controls are incomplete. Supply evidence or escalate to the accountable owner.",
    )


def render_step_indicator(evaluation, has_resolution: bool) -> None:
    gap_done = evaluation.detected_gap is not None or evaluation.final_decision == "allow"
    question_done = evaluation.question_asked is not None or evaluation.final_decision == "allow"
    evidence_done = bool(evaluation.resolution_evidence) or evaluation.resolution_status == "not_applicable"

    steps = [
        ("1", "Proposed Action", "complete"),
        ("2", "Control Gap Check", "complete" if gap_done else "pending"),
        ("3", "Minimum Useful Question", "complete" if question_done else "pending"),
        ("4", "Evidence Supplied", "complete" if evidence_done else ("active" if has_resolution else "pending")),
        ("5", "Decision", decision_step_state(evaluation)),
    ]

    html = ['<div class="steps">']
    for number, label, state in steps:
        html.append(
            f"""
            <div class="step {state}">
              <div class="step-number">{number}</div>
              <div class="step-label">{label}</div>
            </div>
            """
        )
    html.append("</div>")
    st.markdown("".join(html), unsafe_allow_html=True)


def render_action_card(action) -> None:
    card_open("Proposed Action", "What the AI agent wants to execute")
    field("Actor", action.actor_id)
    field("Action", action.action_type)
    field("Target", action.target)
    field("Environment", action.environment)
    field("Timestamp", action.timestamp)
    field("Reversibility", action.reversibility)
    card_close()


def render_control_gap_card(evaluation) -> None:
    card_open("Control Gap Check", "The missing required control, if any")
    field("Detected Control Gap", evaluation.detected_gap or "None")
    if evaluation.missing_evidence:
        st.markdown("<div class='field-label'>Required Controls Missing</div>", unsafe_allow_html=True)
        for item in evaluation.missing_evidence:
            chip(CONTROL_LABELS.get(item, item), "warning")
    else:
        chip("No missing required controls", "success")

    st.markdown("<div class='field-label'>Minimum Useful Question</div>", unsafe_allow_html=True)
    if evaluation.question_asked:
        st.markdown(f"<div class='question'>{evaluation.question_asked}</div>", unsafe_allow_html=True)
    else:
        st.markdown("<div class='muted'>No question needed.</div>", unsafe_allow_html=True)
    card_close()


def render_evidence_card(evaluation, has_resolution: bool) -> None:
    card_open("Evidence Supplied", "What closes the control gap")
    if evaluation.resolution_evidence:
        for item in evaluation.resolution_evidence:
            chip(format_evidence(item), "success")
    elif has_resolution:
        st.markdown("<div class='muted'>Supplied evidence is incomplete.</div>", unsafe_allow_html=True)
        for item in evaluation.missing_evidence:
            chip(f"Still missing: {CONTROL_LABELS.get(item, item)}", "warning")
    else:
        st.markdown(
            "<div class='muted'>Use the sidebar to supply rollback owner, support owner, and rollback plan.</div>",
            unsafe_allow_html=True,
        )
    card_close()


def render_decision_card(evaluation, has_resolution: bool) -> None:
    card_open("Decision", "Minimum useful intervention selected by the runtime")
    decision_class = {
        "allow": "success",
        "ask": "warning",
        "confirm": "warning",
        "escalate": "danger",
    }.get(evaluation.final_decision, "neutral")
    chip(evaluation.final_decision.upper(), decision_class)
    field("Resolution Status", evaluation.resolution_status)
    st.markdown("<div class='field-label'>Decision Rationale</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='muted'>{evaluation.rationale}</div>", unsafe_allow_html=True)
    if has_resolution and evaluation.final_decision == "allow":
        st.markdown("<div class='decision-flow'>ASK → RESOLVED → ALLOW</div>", unsafe_allow_html=True)
    card_close()


def status_card(kind: str, title: str, body: str) -> None:
    st.markdown(
        f"""
        <div class="status {kind}">
          <div class="status-title">{title}</div>
          <div class="status-body">{body}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def card_open(title: str, subtitle: str) -> None:
    st.markdown(
        f"""
        <div class="panel">
          <div class="panel-title">{title}</div>
          <div class="panel-subtitle">{subtitle}</div>
        """,
        unsafe_allow_html=True,
    )


def card_close() -> None:
    st.markdown("</div>", unsafe_allow_html=True)


def field(label: str, value: Any) -> None:
    st.markdown(
        f"""
        <div class="field">
          <div class="field-label">{label}</div>
          <div class="field-value">{value}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def chip(label: str, kind: str) -> None:
    st.markdown(f"<span class='chip {kind}'>{label}</span>", unsafe_allow_html=True)


def format_evidence(item: str) -> str:
    key, _, value = item.partition(":")
    label = CONTROL_LABELS.get(key, key.replace("_", " ").title())
    return f"{label}: {value}"


def decision_step_state(evaluation) -> str:
    if evaluation.final_decision == "allow":
        return "complete"
    if evaluation.final_decision in {"ask", "confirm"}:
        return "active"
    return "blocked"


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
        :root {
          --uh-bg: #0b1020;
          --uh-panel: #111827;
          --uh-panel-2: #151f32;
          --uh-border: #263247;
          --uh-text: #edf2f7;
          --uh-muted: #9aa7b8;
          --uh-blue: #7dd3fc;
          --uh-green: #7ce7ac;
          --uh-amber: #f8c66d;
          --uh-red: #ff8a8a;
        }

        .stApp {
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 34rem),
            linear-gradient(180deg, #0a0f1e 0%, #0b1020 100%);
          color: var(--uh-text);
        }

        [data-testid="stSidebar"] {
          background: #090e1a;
          border-right: 1px solid var(--uh-border);
        }

        .block-container {
          padding-top: 2rem;
          padding-bottom: 3rem;
          max-width: 1280px;
        }

        .hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1rem;
          border: 1px solid var(--uh-border);
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(21, 31, 50, 0.92));
          box-shadow: 0 20px 60px rgba(0,0,0,0.28);
        }

        .hero h1 {
          margin: 0.25rem 0;
          font-size: 2.1rem;
          letter-spacing: 0;
        }

        .hero p {
          color: var(--uh-muted);
          margin: 0;
        }

        .eyebrow {
          color: var(--uh-blue);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08rem;
          font-weight: 700;
        }

        .hero-proof {
          color: #dbeafe;
          background: rgba(125, 211, 252, 0.08);
          border: 1px solid rgba(125, 211, 252, 0.24);
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          white-space: nowrap;
          font-size: 0.95rem;
        }

        .status {
          margin: 1rem 0 1.2rem;
          padding: 1rem 1.2rem;
          border-radius: 12px;
          border: 1px solid var(--uh-border);
          background: rgba(17, 24, 39, 0.92);
        }

        .status.success { border-color: rgba(124, 231, 172, 0.42); background: rgba(20, 83, 45, 0.18); }
        .status.warning { border-color: rgba(248, 198, 109, 0.48); background: rgba(120, 74, 15, 0.20); }
        .status.danger { border-color: rgba(255, 138, 138, 0.48); background: rgba(127, 29, 29, 0.22); }
        .status-title { font-size: 1.05rem; font-weight: 800; margin-bottom: 0.25rem; }
        .status-body { color: #d8dee9; }

        .steps {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.75rem;
          margin: 0.5rem 0 1.5rem;
        }

        .step {
          min-height: 74px;
          padding: 0.8rem;
          border-radius: 12px;
          border: 1px solid var(--uh-border);
          background: rgba(17, 24, 39, 0.8);
        }

        .step.complete { border-color: rgba(124, 231, 172, 0.36); }
        .step.active { border-color: rgba(248, 198, 109, 0.5); }
        .step.blocked { border-color: rgba(255, 138, 138, 0.52); }
        .step-number { color: var(--uh-blue); font-weight: 800; }
        .step-label { color: var(--uh-text); font-size: 0.92rem; margin-top: 0.35rem; }

        .panel {
          min-height: 285px;
          padding: 1rem 1.1rem;
          margin: 0.6rem 0 1rem;
          border: 1px solid var(--uh-border);
          border-radius: 14px;
          background: rgba(17, 24, 39, 0.88);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }

        .panel-title { font-size: 1.05rem; font-weight: 800; }
        .panel-subtitle { color: var(--uh-muted); margin-bottom: 0.85rem; font-size: 0.9rem; }
        .field { margin: 0.65rem 0; }
        .field-label { color: var(--uh-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04rem; font-weight: 700; }
        .field-value { color: var(--uh-text); font-size: 0.96rem; margin-top: 0.15rem; }
        .muted { color: var(--uh-muted); line-height: 1.45; }
        .question {
          margin-top: 0.35rem;
          padding: 0.8rem;
          border-radius: 10px;
          color: #fff7ed;
          background: rgba(248, 198, 109, 0.12);
          border: 1px solid rgba(248, 198, 109, 0.28);
        }

        .chip {
          display: inline-block;
          margin: 0.35rem 0.35rem 0.2rem 0;
          padding: 0.42rem 0.58rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid var(--uh-border);
        }

        .chip.success { color: var(--uh-green); border-color: rgba(124, 231, 172, 0.38); background: rgba(20, 83, 45, 0.22); }
        .chip.warning { color: var(--uh-amber); border-color: rgba(248, 198, 109, 0.42); background: rgba(120, 74, 15, 0.20); }
        .chip.danger { color: var(--uh-red); border-color: rgba(255, 138, 138, 0.44); background: rgba(127, 29, 29, 0.22); }
        .chip.neutral { color: var(--uh-muted); }
        .decision-flow {
          margin-top: 1rem;
          padding: 0.8rem;
          border-radius: 10px;
          text-align: center;
          font-weight: 900;
          color: #052e16;
          background: linear-gradient(90deg, #86efac, #7dd3fc);
        }

        @media (max-width: 900px) {
          .hero { display: block; }
          .hero-proof { margin-top: 1rem; white-space: normal; }
          .steps { grid-template-columns: 1fr; }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
