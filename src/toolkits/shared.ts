import type { CliDisplayOptions, ExecuteActionResult, ToolkitAction } from "../types.js";
import { unique } from "../utils/strings.js";

export interface ToolkitSummaryRenderInput {
  action: ToolkitAction;
  toolkit: ToolkitDefinition;
  execution: ExecuteActionResult;
  display: CliDisplayOptions;
}

export interface ToolkitOutputSummary {
  hasSummaryDefault(action: ToolkitAction): boolean;
  renderExecutionResult(result: ToolkitSummaryRenderInput): string | undefined;
}

export interface ToolkitDefinition {
  directoryName: string;
  cliName: string;
  apiSlug: string;
  toolPrefix: string;
  displayName: string;
  summary: string;
  capabilities: string[];
  examples: string[];
  readCheckActions: string[];
  aliases: string[];
  outputSummary?: ToolkitOutputSummary | undefined;
}

export function defineToolkit(
  definition: Omit<ToolkitDefinition, "aliases" | "toolPrefix"> & {
    aliases?: string[];
    toolPrefix?: string;
    outputSummary?: ToolkitOutputSummary;
  }
): ToolkitDefinition {
  return {
    ...definition,
    toolPrefix: definition.toolPrefix ?? definition.apiSlug.replace(/-/g, "_").toUpperCase(),
    aliases: unique([
      definition.cliName,
      definition.apiSlug,
      definition.directoryName,
      ...(definition.aliases ?? []),
    ]),
  };
}
