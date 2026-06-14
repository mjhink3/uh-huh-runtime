"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  FileQuestion,
  ShieldCheck,
  Triangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Action, Evaluation, ResolutionInput, Reversibility } from "@/lib/runtime";
import { evaluateAction } from "@/lib/runtime";

type Scenario = {
  label: string;
  command: string;
  description: string;
  action: Action;
};

const scenarios: Record<string, Scenario> = {
  recovery: {
    label: "Recovery Ownership Gap",
    command: "deploy payments-api --prod",
    description: "Production deploy missing recovery ownership.",
    action: {
      actionId: "act_prod_001",
      actorId: "release-agent",
      actionType: "deploy",
      target: "payments-api",
      environment: "production",
      timestamp: "2026-06-14T10:15:00-07:00",
      reversibility: "medium",
    },
  },
  present: {
    label: "Ownership Evidence Present",
    command: "deploy payments-api --prod --rollback-ready",
    description: "Production deploy with required recovery evidence.",
    action: {
      actionId: "act_prod_002",
      actorId: "release-agent",
      actionType: "deploy",
      target: "payments-api",
      environment: "production",
      timestamp: "2026-06-14T10:15:00-07:00",
      rollbackOwner: "jane@example.com",
      supportOwner: "sre-oncall",
      rollbackPlan: "https://runbooks.example.com/payments-api/rollback",
      reversibility: "medium",
    },
  },
  afterHours: {
    label: "After-Hours Production Change",
    command: "deploy payments-api --prod --after-hours",
    description: "Low-reversibility production change after hours.",
    action: {
      actionId: "act_prod_003",
      actorId: "release-agent",
      actionType: "deploy",
      target: "payments-api",
      environment: "production",
      timestamp: "2026-06-14T18:15:00-07:00",
      reversibility: "low",
    },
  },
};

const evidenceLabels: Record<string, string> = {
  rollback_owner: "Rollback owner",
  support_owner: "Support owner",
  rollback_plan: "Rollback plan",
};

const CUSTOM_KEY = "custom";

const defaultCustomAction: Action = {
  actionId: "act_custom_001",
  actorId: "custom-agent",
  actionType: "deploy",
  target: "inventory-api",
  environment: "production",
  timestamp: "2026-06-14T16:00:00-07:00",
  reversibility: "medium",
};

export default function Home() {
  const [scenarioKey, setScenarioKey] = useState("recovery");
  const [rollbackOwner, setRollbackOwner] = useState("");
  const [supportOwner, setSupportOwner] = useState("");
  const [rollbackPlan, setRollbackPlan] = useState("");
  const [submittedEvidence, setSubmittedEvidence] = useState<ResolutionInput>({});
  const [customDraft, setCustomDraft] = useState<Action>(defaultCustomAction);
  const [evaluatedCustomAction, setEvaluatedCustomAction] =
    useState<Action>(defaultCustomAction);

  const isCustom = scenarioKey === CUSTOM_KEY;
  const scenario = isCustom ? customScenario(evaluatedCustomAction) : scenarios[scenarioKey];
  const activeAction = isCustom ? evaluatedCustomAction : scenario.action;
  const initialEvaluation = useMemo(
    () => evaluateAction(isCustom ? activeAction : scenario.action),
    [activeAction, isCustom, scenario.action],
  );
  const evaluation = useMemo(
    () => (isCustom ? evaluateAction(activeAction) : evaluateAction(scenario.action, submittedEvidence)),
    [activeAction, isCustom, scenario.action, submittedEvidence],
  );
  const hasSubmittedEvidence = isCustom
    ? hasRecoveryEvidence(activeAction)
    : Object.values(submittedEvidence).some((value) => value?.trim());
  const state = consoleState(evaluation, initialEvaluation, hasSubmittedEvidence);

  function submitEvidence() {
    setSubmittedEvidence({
      rollbackOwner,
      supportOwner,
      rollbackPlan,
    });
  }

  function clearEvidence() {
    setRollbackOwner("");
    setSupportOwner("");
    setRollbackPlan("");
    setSubmittedEvidence({});
  }

  function selectScenario(key: string) {
    setScenarioKey(key);
    clearEvidence();
  }

  function updateCustomAction<K extends keyof Action>(key: K, value: Action[K]) {
    setCustomDraft((current) => ({ ...current, [key]: value }));
  }

  function evaluateCustomAction() {
    setEvaluatedCustomAction(normalizeCustomAction(customDraft));
  }

  function resetCustomAction() {
    setCustomDraft(defaultCustomAction);
    setEvaluatedCustomAction(defaultCustomAction);
  }

  const advancedPayload = isCustom
    ? {
        mode: "custom",
        input: { draftAction: customDraft, evaluatedAction: activeAction },
        output: evaluation,
      }
    : {
        mode: "scenario",
        input: { action: scenario.action, submittedEvidence },
        output: evaluation,
      };

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <div className="console-vignette mx-auto flex h-full max-w-[1800px] flex-col gap-4 px-5 py-4">
        <ConsoleHeader state={state} />

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.82fr_1.46fr_0.9fr]">
          <PausePanel
            active={scenarioKey}
            scenario={scenario}
            isCustom={isCustom}
            customDraft={customDraft}
            evaluatedAction={activeAction}
            evaluation={evaluation}
            onSelect={selectScenario}
            onCustomChange={updateCustomAction}
          />
          <QuestionPanel action={activeAction} evaluation={evaluation} state={state} />
          <ProceedPanel
            action={activeAction}
            evaluation={evaluation}
            state={state}
            hasSubmittedEvidence={hasSubmittedEvidence}
            rollbackOwner={isCustom ? customDraft.rollbackOwner ?? "" : rollbackOwner}
            supportOwner={isCustom ? customDraft.supportOwner ?? "" : supportOwner}
            rollbackPlan={isCustom ? customDraft.rollbackPlan ?? "" : rollbackPlan}
            onRollbackOwner={(value) =>
              isCustom ? updateCustomAction("rollbackOwner", value) : setRollbackOwner(value)
            }
            onSupportOwner={(value) =>
              isCustom ? updateCustomAction("supportOwner", value) : setSupportOwner(value)
            }
            onRollbackPlan={(value) =>
              isCustom ? updateCustomAction("rollbackPlan", value) : setRollbackPlan(value)
            }
            onSubmit={isCustom ? evaluateCustomAction : submitEvidence}
            onClear={isCustom ? resetCustomAction : clearEvidence}
            isCustom={isCustom}
          />
        </section>

        <ExecutionSpine
          action={activeAction}
          evaluation={evaluation}
          advancedPayload={advancedPayload}
          state={state}
        />
      </div>
    </main>
  );
}

function ConsoleHeader({ state }: { state: ReturnType<typeof consoleState> }) {
  return (
    <header className="console-frame flex h-[76px] shrink-0 items-center justify-between px-4 md:px-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-white/[0.12] bg-white p-1.5">
          <Image
            src="/brand/uh-huh-runtime-logo.png"
            alt="Uh-Huh Runtime logo"
            width={96}
            height={96}
            priority
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-[0.08em]">UH-HUH RUNTIME</div>
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Execution checkpoint
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <PhaseTag label="Pause" active={state.phase === "pause"} tone="gray" />
        <Connector active={state.phase !== "proceed"} tone="amber" />
        <PhaseTag label="Question" active={state.phase === "question"} tone="amber" />
        <Connector active={state.phase === "proceed"} tone="green" />
        <PhaseTag label="Proceed" active={state.phase === "proceed"} tone="green" />
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("status-dot", state.dotClass)} />
        <span className={cn("text-sm font-semibold uppercase tracking-[0.18em]", state.textClass)}>
          {state.decision}
        </span>
      </div>
    </header>
  );
}

function PausePanel({
  active,
  scenario,
  isCustom,
  customDraft,
  evaluatedAction,
  evaluation,
  onSelect,
  onCustomChange,
}: {
  active: string;
  scenario: Scenario;
  isCustom: boolean;
  customDraft: Action;
  evaluatedAction: Action;
  evaluation: Evaluation;
  onSelect: (key: string) => void;
  onCustomChange: <K extends keyof Action>(key: K, value: Action[K]) => void;
}) {
  return (
    <section className="console-frame min-h-0 overflow-hidden p-4">
      <PanelLabel eyebrow="01" title="Pause" />

      <div className="mt-5 space-y-2">
        {Object.entries(scenarios).map(([key, item]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "w-full border px-3 py-3 text-left transition",
              active === key
                ? "border-warning/45 bg-warning/[0.08] text-foreground"
                : "border-border/70 bg-[#111214] text-muted-foreground hover:border-white/20 hover:text-foreground",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</span>
              {active === key ? <Triangle className="h-3.5 w-3.5 text-warning" /> : null}
            </div>
            <div className="mt-1 truncate font-mono text-xs">{item.command}</div>
          </button>
        ))}
        <button
          onClick={() => onSelect(CUSTOM_KEY)}
          className={cn(
            "w-full border px-3 py-3 text-left transition",
            active === CUSTOM_KEY
              ? "border-warning/45 bg-warning/[0.08] text-foreground"
              : "border-border/70 bg-[#111214] text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Custom Action
            </span>
            {active === CUSTOM_KEY ? <Triangle className="h-3.5 w-3.5 text-warning" /> : null}
          </div>
          <div className="mt-1 truncate font-mono text-xs">edit proposed execution</div>
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Proposed action
        </div>
        {isCustom ? (
          <>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-warning">
                Draft Action
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Click Evaluate Action to apply edits
              </span>
            </div>
            <CustomActionForm action={customDraft} onChange={onCustomChange} />
            <div className="mt-3 rounded-xl border border-border bg-muted/[0.2] p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Last Evaluated
              </div>
              <div className="mt-1 truncate font-mono text-sm">
                {commandFromAction(evaluatedAction)}
              </div>
            </div>
            <TimestampWarning action={customDraft} />
          </>
        ) : (
          <div className="mt-3 rounded-xl border border-border bg-[#0f1012] p-4">
            <div className="font-mono text-lg text-foreground">{scenario.command}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {scenario.description}
            </p>
          </div>
        )}
      </div>

      {!isCustom ? (
        <dl className="mt-5 space-y-3">
          <Readout label="Actor" value={scenario.action.actorId} />
          <Readout label="Target" value={scenario.action.target} />
          <Readout label="Environment" value={scenario.action.environment} />
          <Readout label="Reversibility" value={scenario.action.reversibility} />
        </dl>
      ) : null}

      <div className="mt-5 rounded-xl border border-border bg-muted/[0.22] p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Control gap</div>
        <div className="mt-2 text-sm font-semibold">
          {evaluation.detectedGap ? "Recovery ownership missing" : "Required controls present"}
        </div>
      </div>
    </section>
  );
}

function CustomActionForm({
  action,
  onChange,
}: {
  action: Action;
  onChange: <K extends keyof Action>(key: K, value: Action[K]) => void;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-[#0f1012] p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Actor">
          <Input
            value={action.actorId}
            onChange={(event) => onChange("actorId", event.target.value)}
            placeholder="release-agent"
            className="h-9"
          />
        </Field>
        <Field label="Action">
          <Input
            value={action.actionType}
            onChange={(event) => onChange("actionType", event.target.value)}
            placeholder="deploy"
            className="h-9"
          />
        </Field>
      </div>
      <Field label="Target">
        <Input
          value={action.target}
          onChange={(event) => onChange("target", event.target.value)}
          placeholder="payments-api"
          className="h-9"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Environment">
          <SelectInput
            value={action.environment}
            onChange={(value) => onChange("environment", value)}
            options={["development", "staging", "production"]}
          />
        </Field>
        <Field label="Reversibility">
          <SelectInput
            value={action.reversibility}
            onChange={(value) => onChange("reversibility", value as Reversibility)}
            options={["high", "medium", "low"]}
          />
        </Field>
      </div>
      <Field label="Timestamp">
        <Input
          value={action.timestamp}
          onChange={(event) => onChange("timestamp", event.target.value)}
          placeholder="2026-06-14T16:00:00-07:00"
          className="h-9 font-mono text-xs"
        />
      </Field>
    </div>
  );
}

function TimestampWarning({ action }: { action: Action }) {
  const status = timestampStatus(action.timestamp);
  if (status.valid && status.afterHours !== null) {
    return null;
  }
  return (
    <div className="mt-3 rounded-xl border border-warning/35 bg-warning/[0.08] p-3 text-xs leading-5 text-warning">
      Timestamp warning: after-hours could not be determined. Use an ISO-like value such as
      2026-06-14T18:15:00-07:00.
    </div>
  );
}

function QuestionPanel({
  action,
  evaluation,
  state,
}: {
  action: Action;
  evaluation: Evaluation;
  state: ReturnType<typeof consoleState>;
}) {
  return (
    <section className="console-frame question-console relative flex min-h-0 flex-col overflow-hidden p-5">
      <div className="absolute right-6 top-6 opacity-25">
        <Triangle className="h-28 w-28 text-warning" strokeWidth={0.7} />
      </div>
      <div className="relative z-10 flex items-start justify-between">
        <PanelLabel eyebrow="02" title="Question" />
        <Badge tone={state.badgeTone}>{state.label}</Badge>
      </div>

      <div className="relative z-10 grid flex-1 place-items-center py-8">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <span className={cn("status-dot", state.dotClass)} />
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Minimum useful question
            </span>
          </div>

          <div className="question-box">
            <FileQuestion className="mb-7 h-10 w-10 text-warning" />
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-normal text-foreground 2xl:text-7xl">
              {evaluation.questionAsked ??
                "No question needed. Required controls are already present."}
            </h1>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Signal
              label="Observation"
              value={evaluation.detectedGap ? "Production action" : "Evidence found"}
              tone="gray"
            />
            <Signal
              label="Gap"
              value={
                evaluation.missingEvidence.length
                  ? `${evaluation.missingEvidence.length} controls missing`
                  : "Closed"
              }
              tone={evaluation.missingEvidence.length ? "amber" : "green"}
            />
            <Signal label="Intervention" value={state.decision} tone={state.signalTone} />
          </div>
          <RuleTrace action={action} evaluation={evaluation} />
        </div>
      </div>
    </section>
  );
}

function RuleTrace({ action, evaluation }: { action: Action; evaluation: Evaluation }) {
  const trace = buildRuleTrace(action, evaluation);
  return (
    <div className="mt-4 rounded-xl border border-border bg-[#101113] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Why Uh-Huh decided
      </div>
      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        {trace.map((item) => (
          <div key={item.label} className="flex min-w-0 items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </span>
            <span className={cn("truncate text-right text-xs font-semibold", item.className)}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProceedPanel({
  action,
  evaluation,
  state,
  hasSubmittedEvidence,
  isCustom,
  rollbackOwner,
  supportOwner,
  rollbackPlan,
  onRollbackOwner,
  onSupportOwner,
  onRollbackPlan,
  onSubmit,
  onClear,
}: {
  action: Action;
  evaluation: Evaluation;
  state: ReturnType<typeof consoleState>;
  hasSubmittedEvidence: boolean;
  isCustom: boolean;
  rollbackOwner: string;
  supportOwner: string;
  rollbackPlan: string;
  onRollbackOwner: (value: string) => void;
  onSupportOwner: (value: string) => void;
  onRollbackPlan: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  const DecisionIcon = state.icon;
  return (
    <section className="console-frame min-h-0 overflow-hidden p-4">
      <PanelLabel eyebrow="03" title="Proceed" />

      <div className="mt-5 rounded-xl border border-border bg-[#101113] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Required evidence
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {evaluation.missingEvidence.length ? (
            evaluation.missingEvidence.map((item) => (
              <Badge tone="amber" key={item}>
                {evidenceLabels[item] ?? item}
              </Badge>
            ))
          ) : (
            <Badge tone="green">Recovery evidence present</Badge>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Field label="Rollback owner">
          <Input
            value={rollbackOwner}
            onChange={(event) => onRollbackOwner(event.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Support owner">
          <Input
            value={supportOwner}
            onChange={(event) => onSupportOwner(event.target.value)}
            placeholder="sre-oncall"
          />
        </Field>
        <Field label="Rollback plan">
          <Input
            value={rollbackPlan}
            onChange={(event) => onRollbackPlan(event.target.value)}
            placeholder="runbook URL"
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button onClick={onSubmit}>{isCustom ? "Evaluate action" : "Supply evidence"}</Button>
        <button
          onClick={onClear}
          className="rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground transition hover:border-white/25 hover:text-foreground"
        >
          {isCustom ? "Reset custom action" : "Clear"}
        </button>
      </div>

      <div className={cn("mt-5 rounded-xl border p-4", state.decisionClass)}>
        <div className="flex items-center gap-2">
          <DecisionIcon className="h-4 w-4" />
          <div className="text-sm font-semibold uppercase tracking-[0.18em]">{state.label}</div>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/75">{state.body}</p>
      </div>

      {hasSubmittedEvidence && evaluation.finalDecision === "allow" ? (
        <div className="mt-4 rounded-xl border border-success/35 bg-success/[0.08] p-3 text-sm font-semibold text-success">
          Control gap closed. Execution may proceed.
        </div>
      ) : null}
      <AuditPreview action={action} evaluation={evaluation} />
    </section>
  );
}

function AuditPreview({ action, evaluation }: { action: Action; evaluation: Evaluation }) {
  const record = auditPreview(action, evaluation);
  return (
    <div className="mt-4 rounded-xl border border-border bg-[#101113] p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Audit preview
      </div>
      <div className="mt-3 space-y-2">
        <AuditRow label="action_id" value={record.action_id} />
        <AuditRow label="actor_id" value={record.actor_id} />
        <AuditRow label="detected_gap" value={record.detected_gap ?? "none"} />
        <AuditRow label="question_asked" value={record.question_asked ?? "none"} />
        <AuditRow label="missing_evidence" value={record.missing_evidence.join(", ") || "none"} />
        <AuditRow label="final_decision" value={record.final_decision} />
        <AuditRow label="resolution_status" value={record.resolution_status} />
        <AuditRow label="timestamp" value={record.timestamp} />
      </div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[0.95fr_1.1fr] gap-3 text-xs">
      <span className="truncate font-mono text-muted-foreground">{label}</span>
      <span className="truncate text-right font-semibold text-foreground/85">{value}</span>
    </div>
  );
}

function ExecutionSpine({
  action,
  evaluation,
  advancedPayload,
  state,
}: {
  action: Action;
  evaluation: Evaluation;
  advancedPayload: unknown;
  state: ReturnType<typeof consoleState>;
}) {
  return (
    <footer className="console-frame grid h-[132px] shrink-0 grid-cols-[1fr_auto] gap-4 overflow-hidden p-4">
      <div className="grid min-w-0 gap-3 md:grid-cols-5">
        <SpineStep label="Action" value={action.actionType} tone="gray" />
        <SpineStep
          label="Gap"
          value={evaluation.detectedGap ? "Detected" : "Closed"}
          tone={evaluation.detectedGap ? "amber" : "green"}
        />
        <SpineStep
          label="Question"
          value={evaluation.questionAsked ? "Required" : "Skipped"}
          tone={evaluation.questionAsked ? "amber" : "green"}
        />
        <SpineStep
          label="Evidence"
          value={
            evaluation.resolutionStatus === "resolved"
              ? "Supplied"
              : evaluation.resolutionStatus === "not_applicable"
                ? "Present"
                : "Missing"
          }
          tone={
            evaluation.resolutionStatus === "resolved" ||
            evaluation.resolutionStatus === "not_applicable"
              ? "green"
              : "amber"
          }
        />
        <SpineStep label="Decision" value={state.decision} tone={state.signalTone} />
      </div>

      <details className="w-[280px] rounded-xl border border-border bg-[#101113] p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Advanced
        </summary>
        <pre className="mt-3 max-h-[74px] overflow-auto text-[10px] leading-4 text-muted-foreground">
          {JSON.stringify(advancedPayload, null, 2)}
        </pre>
      </details>
    </footer>
  );
}

function PanelLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="mt-1 text-3xl font-semibold uppercase tracking-[0.08em]">{title}</div>
    </div>
  );
}

function PhaseTag({
  label,
  active,
  tone,
}: {
  label: string;
  active: boolean;
  tone: "gray" | "amber" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
        active ? toneClass(tone, "active") : toneClass("gray", "quiet"),
      )}
    >
      {label}
    </div>
  );
}

function Connector({ active, tone }: { active: boolean; tone: "amber" | "green" }) {
  return (
    <div
      className={cn(
        "h-px w-12",
        active ? (tone === "green" ? "bg-success/70" : "bg-warning/70") : "bg-border",
      )}
    />
  );
}

function Signal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gray" | "amber" | "green" | "red";
}) {
  return (
    <div className={cn("rounded-xl border p-3", toneClass(tone, "soft"))}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SpineStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gray" | "amber" | "green" | "red";
}) {
  return (
    <div className="min-w-0 border-l border-border pl-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-2 truncate text-sm font-semibold", toneText(tone))}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-xl border border-border bg-[#101114] px-3 text-sm text-foreground outline-none transition focus:border-warning/60 focus:ring-2 focus:ring-warning/10"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}

function consoleState(
  evaluation: Evaluation,
  initialEvaluation: Evaluation,
  hasSubmittedEvidence: boolean,
) {
  if (
    hasSubmittedEvidence &&
    evaluation.finalDecision === "allow" &&
    evaluation.resolutionStatus === "resolved"
  ) {
    return {
      phase: "proceed",
      label: "Gap resolved",
      decision: "ALLOW",
      body: "Recovery evidence is attached to the action record.",
      icon: CheckCircle2,
      badgeTone: "green" as const,
      signalTone: "green" as const,
      textClass: "text-success",
      dotClass: "bg-success shadow-[0_0_16px_rgba(48,255,128,0.35)]",
      decisionClass: "border-success/35 bg-success/[0.08] text-success",
    };
  }

  if (initialEvaluation.finalDecision === "allow" && evaluation.resolutionStatus === "not_applicable") {
    return {
      phase: "proceed",
      label: "Controls present",
      decision: "ALLOW",
      body: "Rollback ownership, support ownership, and rollback plan are already present.",
      icon: ShieldCheck,
      badgeTone: "green" as const,
      signalTone: "green" as const,
      textClass: "text-success",
      dotClass: "bg-success shadow-[0_0_16px_rgba(48,255,128,0.35)]",
      decisionClass: "border-success/35 bg-success/[0.08] text-success",
    };
  }

  if (evaluation.finalDecision === "escalate") {
    return {
      phase: "question",
      label: "Escalation",
      decision: "ESCALATE",
      body: "After-hours, low-reversibility, and missing recovery ownership. Escalation is required.",
      icon: AlertTriangle,
      badgeTone: "red" as const,
      signalTone: "red" as const,
      textClass: "text-danger",
      dotClass: "bg-danger shadow-[0_0_16px_rgba(248,113,113,0.28)]",
      decisionClass: "border-danger/35 bg-danger/[0.08] text-danger",
    };
  }

  return {
    phase: "question",
    label: "Question required",
    decision: "ASK",
    body: "One missing control must be resolved before execution proceeds.",
    icon: CircleAlert,
    badgeTone: "amber" as const,
    signalTone: "amber" as const,
    textClass: "text-warning",
    dotClass: "bg-warning shadow-[0_0_16px_rgba(245,158,11,0.3)]",
    decisionClass: "border-warning/35 bg-warning/[0.08] text-warning",
  };
}

function toneClass(tone: "gray" | "amber" | "green" | "red", mode: "active" | "quiet" | "soft") {
  if (tone === "green") return "border-success/35 bg-success/[0.08] text-success";
  if (tone === "amber") return "border-warning/40 bg-warning/[0.08] text-warning";
  if (tone === "red") return "border-danger/35 bg-danger/[0.08] text-danger";
  return mode === "quiet"
    ? "border-border bg-[#111214] text-muted-foreground"
    : "border-border bg-muted/[0.35] text-foreground";
}

function toneText(tone: "gray" | "amber" | "green" | "red") {
  if (tone === "green") return "text-success";
  if (tone === "amber") return "text-warning";
  if (tone === "red") return "text-danger";
  return "text-foreground";
}

function customScenario(action: Action): Scenario {
  return {
    label: "Custom Action",
    command: commandFromAction(action),
    description: "Editable proposed action for local runtime testing.",
    action,
  };
}

function commandFromAction(action: Action): string {
  const environmentFlag =
    action.environment === "production" ? "--prod" : `--${action.environment}`;
  return `${action.actionType || "act"} ${action.target || "target"} ${environmentFlag}`;
}

function hasRecoveryEvidence(action: Action): boolean {
  return Boolean(action.rollbackOwner?.trim() || action.supportOwner?.trim() || action.rollbackPlan?.trim());
}

function normalizeCustomAction(action: Action): Action {
  return {
    ...action,
    actionId: action.actionId.trim() || defaultCustomAction.actionId,
    actorId: action.actorId.trim() || defaultCustomAction.actorId,
    actionType: action.actionType.trim() || defaultCustomAction.actionType,
    target: action.target.trim() || defaultCustomAction.target,
    environment: action.environment,
    timestamp: action.timestamp.trim() || defaultCustomAction.timestamp,
    rollbackOwner: optionalText(action.rollbackOwner),
    supportOwner: optionalText(action.supportOwner),
    rollbackPlan: optionalText(action.rollbackPlan),
  };
}

function optionalText(value?: string): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildRuleTrace(action: Action, evaluation: Evaluation) {
  const timestamp = timestampStatus(action.timestamp);
  const isProduction = ["prod", "production"].includes(action.environment.trim().toLowerCase());
  const rollbackMissing = !action.rollbackOwner?.trim();
  const supportMissing = !action.supportOwner?.trim();
  const planMissing = !action.rollbackPlan?.trim();
  const rule = !isProduction
    ? "non-production action"
    : evaluation.finalDecision === "escalate"
      ? "production + after-hours + low reversibility + missing recovery evidence"
      : evaluation.detectedGap
        ? "production + missing recovery evidence"
        : "production + recovery evidence present";

  return [
    {
      label: "environment",
      value: action.environment || "missing",
      className: isProduction ? "text-warning" : "text-success",
    },
    {
      label: "rollback_owner",
      value: rollbackMissing ? "missing" : "present",
      className: rollbackMissing ? "text-warning" : "text-success",
    },
    {
      label: "support_owner",
      value: supportMissing ? "missing" : "present",
      className: supportMissing ? "text-warning" : "text-success",
    },
    {
      label: "rollback_plan",
      value: planMissing ? "missing" : "present",
      className: planMissing ? "text-warning" : "text-success",
    },
    {
      label: "after_hours",
      value: timestamp.afterHours === null ? "unknown" : String(timestamp.afterHours),
      className: timestamp.afterHours === null ? "text-warning" : "text-foreground",
    },
    {
      label: "rule",
      value: rule,
      className: evaluation.finalDecision === "allow" ? "text-success" : "text-warning",
    },
    {
      label: "decision",
      value: evaluation.finalDecision,
      className:
        evaluation.finalDecision === "allow"
          ? "text-success"
          : evaluation.finalDecision === "escalate"
            ? "text-danger"
            : "text-warning",
    },
  ];
}

function auditPreview(action: Action, evaluation: Evaluation) {
  return {
    action_id: action.actionId,
    actor_id: action.actorId,
    detected_gap: evaluation.detectedGap,
    question_asked: evaluation.questionAsked,
    missing_evidence: evaluation.missingEvidence,
    final_decision: evaluation.finalDecision,
    resolution_status: evaluation.resolutionStatus,
    timestamp: action.timestamp,
  };
}

function timestampStatus(timestamp: string): { valid: boolean; afterHours: boolean | null } {
  const hourText = timestamp.split("T", 2)[1]?.slice(0, 2);
  const hour = Number(hourText);
  if (!hourText || Number.isNaN(hour) || hour < 0 || hour > 23) {
    return { valid: false, afterHours: null };
  }
  return { valid: true, afterHours: hour < 8 || hour >= 17 };
}
