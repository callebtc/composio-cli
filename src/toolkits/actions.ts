import type { JsonSchemaObject, ToolkitAction } from "../types.js";
import { normalizeToken, toKebabCase, unique } from "../utils/strings.js";

interface RawToolShape {
  slug: string;
  name: string;
  description?: string | undefined;
  version?: string | undefined;
  isDeprecated?: boolean | undefined;
  inputParameters?: unknown;
  outputParameters?: unknown;
  toolkit?: {
    slug: string;
    name: string;
  } | undefined;
}

export function buildToolkitAction(toolPrefix: string, tool: RawToolShape): ToolkitAction {
  const suffix = stripToolPrefix(toolPrefix, tool.slug);
  const cliName = toKebabCase(suffix);
  const slugHyphen = normalizeToken(tool.slug);
  const suffixHyphen = normalizeToken(suffix);

  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    toolkitSlug: tool.toolkit?.slug ?? toolPrefix.toLowerCase(),
    toolkitName: tool.toolkit?.name,
    version: tool.version,
    isDeprecated: tool.isDeprecated,
    inputSchema: tool.inputParameters as JsonSchemaObject | undefined,
    outputSchema: tool.outputParameters as JsonSchemaObject | undefined,
    cliName,
    aliases: unique([
      cliName,
      slugHyphen,
      suffixHyphen,
      tool.slug.toLowerCase(),
      suffix.toLowerCase(),
      suffix.replace(/_/g, "-").toLowerCase(),
    ]),
  };
}

export function resolveToolkitAction(
  actions: ToolkitAction[],
  selector: string
): ToolkitAction | undefined {
  const normalized = normalizeToken(selector);
  return actions.find(action =>
    action.cliName === normalized ||
    action.slug.toLowerCase() === selector.toLowerCase() ||
    action.aliases.includes(normalized)
  );
}

function stripToolPrefix(toolPrefix: string, slug: string): string {
  const prefix = `${toolPrefix.toUpperCase()}_`;
  if (slug.toUpperCase().startsWith(prefix)) {
    return slug.slice(prefix.length);
  }
  return slug;
}
