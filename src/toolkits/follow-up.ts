import { CLI_NAME } from "../constants.js";
import type { JsonSchemaObject } from "../types.js";
import type { ToolkitSummaryRenderInput } from "./shared.js";
import { normalizeToken } from "../utils/strings.js";

export function findInputProperty(
  schema: JsonSchemaObject | undefined,
  candidates: string[]
): string | undefined {
  const properties = schema?.properties ?? {};
  const entries = Object.keys(properties).map(key => ({
    key,
    normalized: normalizeToken(key),
  }));
  const normalizedCandidates = candidates.map(candidate => normalizeToken(candidate));
  return entries.find(entry => normalizedCandidates.includes(entry.normalized))?.key;
}

export function buildReplayCommand(
  result: ToolkitSummaryRenderInput,
  inputOverrides: Record<string, unknown>
): string {
  const nextInput = {
    ...result.execution.input,
    ...inputOverrides,
  };
  return `${CLI_NAME} ${result.toolkit.cliName} ${result.action.cliName} --input '${JSON.stringify(nextInput)}' --api-key <key>`;
}
