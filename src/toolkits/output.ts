import type { ToolkitAction } from "../types.js";
import type { ToolkitDefinition, ToolkitSummaryRenderInput } from "./shared.js";

export function hasSummaryDefault(toolkit: ToolkitDefinition, action: ToolkitAction): boolean {
  return toolkit.outputSummary?.hasSummaryDefault(action) ?? false;
}

export function renderSummarizedExecutionResult(
  result: ToolkitSummaryRenderInput
): string | undefined {
  return result.toolkit.outputSummary?.renderExecutionResult(result);
}
