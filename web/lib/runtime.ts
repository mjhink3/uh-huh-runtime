export type Decision = "allow" | "ask" | "confirm" | "escalate";
export type ResolutionStatus = "not_applicable" | "unresolved" | "resolved" | "escalated";
export type Reversibility = "high" | "medium" | "low";

export type Action = {
  actionId: string;
  actorId: string;
  actionType: string;
  target: string;
  environment: string;
  timestamp: string;
  rollbackOwner?: string;
  supportOwner?: string;
  rollbackPlan?: string;
  reversibility: Reversibility;
};

export type ResolutionInput = {
  rollbackOwner?: string;
  supportOwner?: string;
  rollbackPlan?: string;
};

export type Evaluation = {
  decision: Decision;
  detectedGap: string | null;
  missingEvidence: string[];
  questionAsked: string | null;
  resolutionStatus: ResolutionStatus;
  resolutionEvidence: string[];
  finalDecision: Decision;
  rationale: string;
};

export const RECOVERY_OWNERSHIP_GAP = "recovery_ownership_gap";
export const RECOVERY_OWNERSHIP_QUESTION =
  "Who owns rollback and support coverage if this fails?";

export function evaluateAction(action: Action, resolution: ResolutionInput = {}): Evaluation {
  const resolvedAction = {
    ...action,
    rollbackOwner: clean(resolution.rollbackOwner) ?? action.rollbackOwner,
    supportOwner: clean(resolution.supportOwner) ?? action.supportOwner,
    rollbackPlan: clean(resolution.rollbackPlan) ?? action.rollbackPlan,
  };

  if (!isProduction(resolvedAction)) {
    return {
      decision: "allow",
      detectedGap: null,
      missingEvidence: [],
      questionAsked: null,
      resolutionStatus: "not_applicable",
      resolutionEvidence: [],
      finalDecision: "allow",
      rationale: "Action is not production; Recovery Ownership Gap does not apply.",
    };
  }

  const missing = detectRecoveryOwnershipGap(resolvedAction);
  const hasResolutionInput =
    clean(resolution.rollbackOwner) !== undefined ||
    clean(resolution.supportOwner) !== undefined ||
    clean(resolution.rollbackPlan) !== undefined;

  if (missing.length === 0) {
    return {
      decision: "allow",
      detectedGap: null,
      missingEvidence: [],
      questionAsked: null,
      resolutionStatus: hasResolutionInput ? "resolved" : "not_applicable",
      resolutionEvidence: resolutionEvidence(resolvedAction),
      finalDecision: "allow",
      rationale: "Production action has rollback and support ownership evidence.",
    };
  }

  const decision = unresolvedProductionDecision(resolvedAction, missing);
  return {
    decision,
    detectedGap: RECOVERY_OWNERSHIP_GAP,
    missingEvidence: missing,
    questionAsked: RECOVERY_OWNERSHIP_QUESTION,
    resolutionStatus: decision === "escalate" ? "escalated" : "unresolved",
    resolutionEvidence: resolutionEvidence(resolvedAction),
    finalDecision: decision,
    rationale: hasResolutionInput
      ? "Resolution input was supplied, but required ownership evidence is still missing."
      : "Production action lacks named rollback or support ownership.",
  };
}

function detectRecoveryOwnershipGap(action: Action): string[] {
  const missing: string[] = [];
  if (!clean(action.rollbackOwner)) missing.push("rollback_owner");
  if (!clean(action.supportOwner)) missing.push("support_owner");
  if (!clean(action.rollbackPlan)) missing.push("rollback_plan");
  const ownerMissing = missing.includes("rollback_owner") || missing.includes("support_owner");
  return ownerMissing ? missing : [];
}

function unresolvedProductionDecision(action: Action, missing: string[]): Decision {
  if (isAfterHours(action) && action.reversibility === "low") {
    if (missing.includes("rollback_owner") && missing.includes("support_owner")) {
      return "escalate";
    }
    return "confirm";
  }
  return "ask";
}

function resolutionEvidence(action: Action): string[] {
  const evidence: string[] = [];
  if (clean(action.rollbackOwner)) evidence.push(`rollback_owner:${action.rollbackOwner}`);
  if (clean(action.supportOwner)) evidence.push(`support_owner:${action.supportOwner}`);
  if (clean(action.rollbackPlan)) evidence.push(`rollback_plan:${action.rollbackPlan}`);
  return evidence;
}

function isProduction(action: Action): boolean {
  return ["prod", "production"].includes(action.environment.trim().toLowerCase());
}

function isAfterHours(action: Action): boolean {
  const hour = Number(action.timestamp.split("T")[1]?.slice(0, 2));
  if (Number.isNaN(hour)) return false;
  return hour < 8 || hour >= 17;
}

function clean(value?: string): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}
