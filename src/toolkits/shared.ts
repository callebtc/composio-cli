import { unique } from "../utils/strings.js";

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
}

export function defineToolkit(
  definition: Omit<ToolkitDefinition, "aliases" | "toolPrefix"> & {
    aliases?: string[];
    toolPrefix?: string;
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

