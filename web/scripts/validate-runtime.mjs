import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");

const runtimePath = path.join(webRoot, "lib", "runtime.ts");
const fixturePath = path.join(repoRoot, "test_scenarios", "recovery_ownership_cases.json");

const source = fs.readFileSync(runtimePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const module = { exports: {} };
vm.runInNewContext(transpiled.outputText, { module, exports: module.exports }, { filename: runtimePath });

const { evaluateAction } = module.exports;
if (typeof evaluateAction !== "function") {
  throw new Error("evaluateAction export was not found in web/lib/runtime.ts");
}

const cases = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
let failures = 0;

for (const testCase of cases) {
  const result = evaluateAction(toWebAction(testCase.action));
  const expected = testCase.expected;

  failures += assertEqual(testCase.case_id, "finalDecision", result.finalDecision, expected.final_decision);
  failures += assertEqual(testCase.case_id, "detectedGap", result.detectedGap, expected.detected_gap);
  failures += assertEqual(
    testCase.case_id,
    "resolutionStatus",
    result.resolutionStatus,
    expected.resolution_status,
  );

  if (expected.missing_evidence) {
    failures += assertEqual(
      testCase.case_id,
      "missingEvidence",
      result.missingEvidence,
      expected.missing_evidence,
    );
  }
}

if (failures > 0) {
  throw new Error(`${failures} TypeScript runtime parity assertion(s) failed.`);
}

console.log(`TypeScript runtime parity passed for ${cases.length} shared recovery ownership cases.`);

function toWebAction(action) {
  return {
    actionId: action.action_id,
    actorId: action.actor_id,
    actionType: action.action_type,
    target: action.target,
    environment: action.environment,
    timestamp: action.timestamp,
    rollbackOwner: action.rollback_owner ?? undefined,
    supportOwner: action.support_owner ?? undefined,
    rollbackPlan: action.rollback_plan ?? undefined,
    reversibility: action.reversibility,
  };
}

function assertEqual(caseId, field, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    return 0;
  }
  console.error(
    `[${caseId}] ${field} mismatch\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`,
  );
  return 1;
}
