"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  ShieldAlert,
  ShieldCheck,
  Triangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Action, Evaluation, ResolutionInput } from "@/lib/runtime";
import { evaluateAction } from "@/lib/runtime";

type Scenario = {
  label: string;
  short: string;
  description: string;
  action: Action;
};

const scenarios: Record<string, Scenario> = {
  recovery: {
    label: "Recovery Ownership Gap",
    short: "Missing ownership",
    description: "A production deploy is ready, but recovery ownership is absent.",
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
    short: "Controls present",
    description: "The deploy already carries rollback ownership and support evidence.",
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
    short: "Escalation pressure",
    description: "A low-reversibility after-hours deploy is missing recovery evidence.",
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

export default function Home() {
  const [scenarioKey, setScenarioKey] = useState("recovery");
  const [rollbackOwner, setRollbackOwner] = useState("");
  const [supportOwner, setSupportOwner] = useState("");
  const [rollbackPlan, setRollbackPlan] = useState("");
  const [submittedEvidence, setSubmittedEvidence] = useState<ResolutionInput>({});

  const scenario = scenarios[scenarioKey];
  const initialEvaluation = useMemo(() => evaluateAction(scenario.action), [scenario.action]);
  const evaluation = useMemo(
    () => evaluateAction(scenario.action, submittedEvidence),
    [scenario.action, submittedEvidence],
  );
  const hasSubmittedEvidence = Object.values(submittedEvidence).some((value) => value?.trim());

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

  return (
    <main className="min-h-screen overflow-hidden">
      <BrandShell>
        <Hero />

        <section className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <ScenarioRail active={scenarioKey} onSelect={selectScenario} />

          <div className="space-y-6">
            <DecisionStrip
              evaluation={evaluation}
              initialEvaluation={initialEvaluation}
              hasSubmittedEvidence={hasSubmittedEvidence}
            />
            <CheckpointLine evaluation={evaluation} hasSubmittedEvidence={hasSubmittedEvidence} />
            <DemoStage
              scenario={scenario}
              evaluation={evaluation}
              hasSubmittedEvidence={hasSubmittedEvidence}
              rollbackOwner={rollbackOwner}
              supportOwner={supportOwner}
              rollbackPlan={rollbackPlan}
              onRollbackOwner={setRollbackOwner}
              onSupportOwner={setSupportOwner}
              onRollbackPlan={setRollbackPlan}
              onSubmit={submitEvidence}
              onClear={clearEvidence}
            />
            <AdvancedDetails
              action={scenario.action}
              submittedEvidence={submittedEvidence}
              evaluation={evaluation}
            />
          </div>
        </section>

        <BroaderUse />
      </BrandShell>
    </main>
  );
}

function BrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-5 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
      <header className="relative z-10 flex items-center justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/[0.12] bg-white p-1.5 shadow-brand">
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
            <div className="text-sm font-semibold text-foreground">Uh-Huh Runtime</div>
            <div className="text-xs text-muted-foreground">Pause. Question. Proceed.</div>
          </div>
        </div>
        <Badge tone="neutral">V0.1 public demo</Badge>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Hero() {
  return (
    <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:py-12">
      <div className="max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-warning">
          The question before execution
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-foreground md:text-7xl">
          Before an agent acts, close the missing control.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Uh-Huh catches missing operational controls before consequential actions proceed.
          Not more approvals. Better questions.
        </p>
      </div>
      <div className="rounded-[2rem] border border-border/80 bg-card/[0.72] p-5 shadow-brand backdrop-blur">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Runtime motif</span>
          <Triangle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-8 flex items-center gap-3">
          <MotifStep label="Pause" tone="neutral" />
          <div className="h-px flex-1 bg-border" />
          <div className="relative grid h-12 w-12 place-items-center rounded-full border border-warning/50 bg-warning/10 text-warning shadow-question">
            <FileQuestion className="h-5 w-5" />
            <span className="absolute -bottom-6 text-xs font-semibold">Question</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <MotifStep label="Proceed" tone="green" />
        </div>
        <div className="mt-10 rounded-2xl border border-warning/25 bg-warning/[0.07] p-4 text-sm leading-6 text-foreground/[0.86]">
          The demo pauses only when recovery ownership is missing, then asks for the
          evidence needed to continue.
        </div>
      </div>
    </section>
  );
}

function MotifStep({ label, tone }: { label: string; tone: "neutral" | "green" }) {
  return (
    <div
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full border text-xs font-semibold",
        tone === "green"
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
      aria-label={label}
      title={label}
    >
      {label.slice(0, 1)}
    </div>
  );
}

function ScenarioRail({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside className="rounded-[2rem] border border-border/80 bg-card/[0.65] p-4 shadow-brand backdrop-blur lg:sticky lg:top-6 lg:self-start">
      <div className="px-2 pb-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Choose a run
        </div>
        <h2 className="mt-2 text-xl font-semibold">Three ways the same runtime behaves.</h2>
      </div>
      <div className="space-y-2">
        {Object.entries(scenarios).map(([key, scenario], index) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "group w-full rounded-2xl border p-4 text-left transition",
              active === key
                ? "border-white/[0.14] bg-muted/[0.62] shadow-brand"
                : "border-transparent bg-transparent hover:border-border hover:bg-muted/35",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold",
                  active === key
                    ? "border-warning/40 bg-warning/[0.10] text-warning"
                    : "border-border text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">{scenario.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{scenario.short}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function DecisionStrip({
  evaluation,
  initialEvaluation,
  hasSubmittedEvidence,
}: {
  evaluation: Evaluation;
  initialEvaluation: Evaluation;
  hasSubmittedEvidence: boolean;
}) {
  const state = decisionState(evaluation, initialEvaluation, hasSubmittedEvidence);
  const Icon = state.icon;
  return (
    <section
      className={cn(
        "rounded-[2rem] border p-5 shadow-brand backdrop-blur",
        state.containerClass,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className={cn("grid h-12 w-12 place-items-center rounded-2xl border", state.iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-semibold">{state.title}</div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/[0.78]">{state.body}</p>
          </div>
        </div>
        <Badge tone={state.badgeTone}>{state.decision}</Badge>
      </div>
    </section>
  );
}

function CheckpointLine({
  evaluation,
  hasSubmittedEvidence,
}: {
  evaluation: Evaluation;
  hasSubmittedEvidence: boolean;
}) {
  const steps = [
    { label: "Action", detail: "Proposed", status: "complete" },
    {
      label: "Control",
      detail: evaluation.detectedGap ? "Gap found" : "Present",
      status: evaluation.detectedGap ? "warning" : "complete",
    },
    {
      label: "Question",
      detail: evaluation.questionAsked ? "Asked" : "Skipped",
      status: evaluation.questionAsked ? "warning" : "complete",
    },
    {
      label: "Evidence",
      detail:
        evaluation.resolutionStatus === "resolved"
          ? "Supplied"
          : evaluation.resolutionStatus === "not_applicable"
            ? "Already present"
            : "Needed",
      status:
        evaluation.resolutionStatus === "resolved" || evaluation.resolutionStatus === "not_applicable"
          ? "complete"
          : hasSubmittedEvidence
            ? "warning"
            : "open",
    },
    {
      label: "Decision",
      detail: evaluation.finalDecision.toUpperCase(),
      status:
        evaluation.finalDecision === "allow"
          ? "complete"
          : evaluation.finalDecision === "escalate"
            ? "danger"
            : "warning",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-border/80 bg-card/[0.54] p-5 backdrop-blur">
      <div className="grid gap-4 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.label} className="relative">
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "absolute left-[2.15rem] top-4 hidden h-px w-[calc(100%-1.5rem)] md:block",
                  step.status === "warning" ? "bg-dashed-gap" : "bg-border",
                )}
              />
            ) : null}
            <div className="relative z-10 flex items-center gap-3 md:block">
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold",
                  stepTone(step.status),
                )}
              >
                {index + 1}
              </span>
              <div className="mt-0 md:mt-3">
                <div className="text-sm font-semibold text-foreground">{step.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{step.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoStage({
  scenario,
  evaluation,
  hasSubmittedEvidence,
  rollbackOwner,
  supportOwner,
  rollbackPlan,
  onRollbackOwner,
  onSupportOwner,
  onRollbackPlan,
  onSubmit,
  onClear,
}: {
  scenario: Scenario;
  evaluation: Evaluation;
  hasSubmittedEvidence: boolean;
  rollbackOwner: string;
  supportOwner: string;
  rollbackPlan: string;
  onRollbackOwner: (value: string) => void;
  onSupportOwner: (value: string) => void;
  onRollbackPlan: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.28fr]">
      <div className="space-y-6">
        <Panel eyebrow="Proposed action" title={scenario.action.target}>
          <p className="mb-5 text-sm leading-6 text-muted-foreground">{scenario.description}</p>
          <dl className="space-y-3">
            <Detail label="Actor" value={scenario.action.actorId} />
            <Detail label="Action" value={scenario.action.actionType} />
            <Detail label="Environment" value={scenario.action.environment} />
            <Detail label="Reversibility" value={scenario.action.reversibility} />
            <Detail label="Timestamp" value={compactTime(scenario.action.timestamp)} />
          </dl>
        </Panel>

        <Panel eyebrow="Control gap" title={evaluation.detectedGap ? "Recovery ownership" : "Required controls present"}>
          {evaluation.missingEvidence.length ? (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                Execution is paused because Uh-Huh cannot find named recovery ownership.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {evaluation.missingEvidence.map((item) => (
                  <Badge tone="amber" key={item}>
                    {evidenceLabels[item] ?? item}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-success/30 bg-success/[0.08] p-4 text-sm leading-6 text-success">
              Rollback ownership, support ownership, and rollback plan are present.
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <QuestionPanel evaluation={evaluation} />
        <EvidenceAndDecision
          evaluation={evaluation}
          hasSubmittedEvidence={hasSubmittedEvidence}
          rollbackOwner={rollbackOwner}
          supportOwner={supportOwner}
          rollbackPlan={rollbackPlan}
          onRollbackOwner={onRollbackOwner}
          onSupportOwner={onSupportOwner}
          onRollbackPlan={onRollbackPlan}
          onSubmit={onSubmit}
          onClear={onClear}
        />
      </div>
    </section>
  );
}

function QuestionPanel({ evaluation }: { evaluation: Evaluation }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-warning/30 bg-question p-7 shadow-question">
      <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-warning/20" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-warning">
          <FileQuestion className="h-4 w-4" />
          Minimum useful question
        </div>
        <blockquote className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          {evaluation.questionAsked ?? "No question needed. The required controls are already present."}
        </blockquote>
        <p className="mt-5 max-w-xl text-sm leading-6 text-foreground/70">
          The runtime does not ask for confidence theater. It asks for the missing
          operational evidence that decides whether execution should continue.
        </p>
      </div>
    </section>
  );
}

function EvidenceAndDecision({
  evaluation,
  hasSubmittedEvidence,
  rollbackOwner,
  supportOwner,
  rollbackPlan,
  onRollbackOwner,
  onSupportOwner,
  onRollbackPlan,
  onSubmit,
  onClear,
}: {
  evaluation: Evaluation;
  hasSubmittedEvidence: boolean;
  rollbackOwner: string;
  supportOwner: string;
  rollbackPlan: string;
  onRollbackOwner: (value: string) => void;
  onSupportOwner: (value: string) => void;
  onRollbackPlan: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
      <Panel eyebrow="Evidence" title="Close the gap">
        <div className="space-y-4">
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
              placeholder="https://runbooks.example.com/rollback"
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onSubmit} className="flex-1">
              Supply evidence
            </Button>
            <button
              onClick={onClear}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-white/25 hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Decision" title={evaluation.finalDecision.toUpperCase()}>
        <div className="space-y-4">
          <DecisionBadge evaluation={evaluation} />
          <p className="text-sm leading-6 text-muted-foreground">{evaluation.rationale}</p>
          {hasSubmittedEvidence && evaluation.finalDecision === "allow" ? (
            <div className="rounded-2xl border border-success/35 bg-success/[0.08] p-4 text-sm font-semibold text-success">
              Control Gap Detected -&gt; Evidence Supplied -&gt; Action Allowed
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/[0.35] p-4 text-sm leading-6 text-muted-foreground">
              Resolution status:{" "}
              <span className="font-semibold text-foreground">{evaluation.resolutionStatus}</span>
            </div>
          )}
        </div>
      </Panel>
    </section>
  );
}

function DecisionBadge({ evaluation }: { evaluation: Evaluation }) {
  if (evaluation.finalDecision === "allow") {
    return (
      <Badge tone="green" className="gap-2">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Action may proceed
      </Badge>
    );
  }
  if (evaluation.finalDecision === "escalate") {
    return (
      <Badge tone="red" className="gap-2">
        <ShieldAlert className="h-3.5 w-3.5" />
        Escalation required
      </Badge>
    );
  }
  return (
    <Badge tone="amber" className="gap-2">
      <CircleAlert className="h-3.5 w-3.5" />
      Ask before execution
    </Badge>
  );
}

function AdvancedDetails({
  action,
  submittedEvidence,
  evaluation,
}: {
  action: Action;
  submittedEvidence: ResolutionInput;
  evaluation: Evaluation;
}) {
  return (
    <details className="rounded-[1.5rem] border border-border/75 bg-card/[0.45] p-5 backdrop-blur">
      <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
        Advanced technical details
      </summary>
      <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-border bg-[#040813] p-4 text-xs leading-6 text-muted-foreground">
        {JSON.stringify({ action, submittedEvidence, evaluation }, null, 2)}
      </pre>
    </details>
  );
}

function BroaderUse() {
  const items = [
    ["Career change", "What control is missing before a consequential role move?"],
    ["Major purchase", "What evidence would make this decision reversible?"],
    ["Travel/lifestyle move", "Who owns recovery if the plan changes under pressure?"],
  ];
  return (
    <section className="pb-8 pt-4">
      <div className="rounded-[2rem] border border-border/70 bg-card/[0.42] p-6 backdrop-blur md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.4fr] md:items-start">
          <div>
            <Badge tone="neutral">Broader use</Badge>
            <h2 className="mt-4 text-2xl font-semibold">The primitive travels.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {items.map(([title, copy]) => (
              <div key={title} className="border-l border-border pl-4">
                <div className="font-semibold">{title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-border/80 bg-card/[0.68] p-5 shadow-brand backdrop-blur",
        className,
      )}
    >
      <div className="mb-5">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-normal text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="max-w-[62%] truncate text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function decisionState(
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
      title: "Gap resolved",
      body: "Recovery ownership evidence is now attached to the action. Execution may proceed.",
      decision: "ALLOW",
      icon: CheckCircle2,
      badgeTone: "green" as const,
      containerClass: "border-success/35 bg-success/[0.08]",
      iconClass: "border-success/35 bg-success/10 text-success",
    };
  }

  if (initialEvaluation.finalDecision === "allow" && evaluation.resolutionStatus === "not_applicable") {
    return {
      title: "Required controls present",
      body: "The action already includes rollback ownership, support ownership, and a rollback plan.",
      decision: "ALLOW",
      icon: ShieldCheck,
      badgeTone: "green" as const,
      containerClass: "border-success/35 bg-success/[0.08]",
      iconClass: "border-success/35 bg-success/10 text-success",
    };
  }

  if (evaluation.finalDecision === "escalate") {
    return {
      title: "Escalation required",
      body: "This is after-hours, low-reversibility, and missing recovery ownership. Uh-Huh will not treat silence as approval.",
      decision: "ESCALATE",
      icon: AlertTriangle,
      badgeTone: "red" as const,
      containerClass: "border-danger/35 bg-danger/[0.08]",
      iconClass: "border-danger/35 bg-danger/10 text-danger",
    };
  }

  return {
    title: "Control gap detected",
    body: "The action is consequential and recovery ownership is missing. Ask the smallest question that closes the gap.",
    decision: "ASK",
    icon: ClipboardCheck,
    badgeTone: "amber" as const,
    containerClass: "border-warning/35 bg-warning/[0.08]",
    iconClass: "border-warning/35 bg-warning/10 text-warning",
  };
}

function stepTone(status: string): string {
  if (status === "complete") return "border-success/35 bg-success/10 text-success";
  if (status === "danger") return "border-danger/35 bg-danger/10 text-danger";
  if (status === "warning") return "border-warning/35 bg-warning/10 text-warning";
  return "border-border bg-muted/[0.45] text-muted-foreground";
}

function compactTime(timestamp: string): string {
  return timestamp.replace("T", " ").replace("-07:00", " PT");
}
