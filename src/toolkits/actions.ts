import type { JsonSchemaObject, ToolkitAction } from "../types.js";
import { chooseClosestIdentifier, type IdentifierResolution } from "../utils/identifiers.js";
import { normalizeToken, toKebabCase, unique } from "../utils/strings.js";

const COMMON_TRAILING_ACTION_VERBS = new Set([
  "list",
  "get",
  "find",
  "fetch",
  "create",
  "update",
  "patch",
  "delete",
  "send",
  "search",
  "read",
  "write",
  "append",
  "move",
  "upload",
  "join",
  "edit",
  "post",
]);

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
  const friendlyAliases = deriveFriendlyActionAliases(cliName);

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
      ...friendlyAliases,
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
    collectActionAliases(action).some(alias => normalizeToken(alias) === normalized) ||
    action.slug.toLowerCase() === selector.toLowerCase()
  );
}

export function resolveToolkitActionSelection(
  actions: ToolkitAction[],
  selector: string
): {
  action?: ToolkitAction;
  resolution?: IdentifierResolution;
} {
  const exact = resolveToolkitAction(actions, selector);
  if (exact) {
    return { action: exact };
  }

  const candidates = actions.flatMap(action =>
    collectActionAliases(action).map(candidate => ({ action, candidate }))
  );
  const uniqueCandidates = unique(candidates.map(entry => entry.candidate));
  const resolution = chooseClosestIdentifier(selector, uniqueCandidates);
  if (!resolution) {
    return {};
  }

  const matched = candidates.find(entry => entry.candidate === resolution.value);
  if (!matched) {
    return {};
  }

  if (resolution.kind === "auto") {
    return {
      action: matched.action,
      resolution: {
        kind: "auto",
        value: matched.action.cliName,
      },
    };
  }

  return {
    resolution: {
      kind: "suggest",
      value: matched.action.cliName,
    },
  };
}

export function getDisplayActionAliases(action: ToolkitAction): string[] {
  return deriveFriendlyActionAliases(action.cliName).filter(alias => alias !== action.cliName);
}

function collectActionAliases(action: ToolkitAction): string[] {
  return unique([
    action.cliName,
    ...action.aliases,
    ...deriveFriendlyActionAliases(action.cliName),
  ]);
}

function deriveFriendlyActionAliases(cliName: string): string[] {
  const parts = cliName.split("-").filter(Boolean);
  if (parts.length < 2) {
    return [];
  }

  const last = parts[parts.length - 1]!;
  if (!COMMON_TRAILING_ACTION_VERBS.has(last)) {
    return [];
  }

  return [`${last}-${parts.slice(0, -1).join("-")}`];
}

function stripToolPrefix(toolPrefix: string, slug: string): string {
  const prefix = `${toolPrefix.toUpperCase()}_`;
  if (slug.toUpperCase().startsWith(prefix)) {
    return slug.slice(prefix.length);
  }
  return slug;
}
