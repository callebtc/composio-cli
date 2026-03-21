import type { CliDisplayOptions, ExecuteActionResult, ToolkitAction } from "../types.js";
import { normalizeToken, unique } from "../utils/strings.js";

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

export interface FeaturedToolkitAction {
  canonical: string;
  priority: number;
  shortHelp: string;
  aliases?: string[];
}

export interface MatchedFeaturedToolkitAction {
  feature: FeaturedToolkitAction;
  action: ToolkitAction;
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
  featuredActions: FeaturedToolkitAction[];
  outputSummary?: ToolkitOutputSummary | undefined;
}

export function defineToolkit(
  definition: Omit<ToolkitDefinition, "aliases" | "toolPrefix" | "featuredActions"> & {
    aliases?: string[];
    toolPrefix?: string;
    featuredActions?: FeaturedToolkitAction[];
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
    featuredActions: [...(definition.featuredActions ?? [])].sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      return left.canonical.localeCompare(right.canonical);
    }),
  };
}

export function prioritizeToolkitActions(
  toolkit: ToolkitDefinition,
  actions: ToolkitAction[]
): {
  featured: MatchedFeaturedToolkitAction[];
  remaining: ToolkitAction[];
  ordered: ToolkitAction[];
} {
  const matchedActionNames = new Set<string>();
  const featured = toolkit.featuredActions
    .map(feature => {
      const action = actions.find(candidate => {
        if (matchedActionNames.has(candidate.cliName)) {
          return false;
        }
        return matchesFeaturedAction(candidate, feature);
      });
      if (action) {
        matchedActionNames.add(action.cliName);
      }
      return action ? { feature, action } : undefined;
    })
    .filter((entry): entry is MatchedFeaturedToolkitAction => Boolean(entry))
    .sort((left, right) => {
      if (right.feature.priority !== left.feature.priority) {
        return right.feature.priority - left.feature.priority;
      }
      return left.action.cliName.localeCompare(right.action.cliName);
    });

  const remaining = actions.filter(action => !matchedActionNames.has(action.cliName));
  return {
    featured,
    remaining,
    ordered: [...featured.map(entry => entry.action), ...remaining],
  };
}

export function getFeaturedActionHelp(
  toolkit: ToolkitDefinition,
  action: ToolkitAction
): string | undefined {
  return toolkit.featuredActions.find(feature => matchesFeaturedAction(action, feature))?.shortHelp;
}

function matchesFeaturedAction(action: ToolkitAction, feature: FeaturedToolkitAction): boolean {
  const actionCandidates = new Set(
    [action.cliName, action.slug, ...action.aliases].map(value => normalizeToken(value))
  );
  const featureCandidates = [feature.canonical, ...(feature.aliases ?? [])].map(value =>
    normalizeToken(value)
  );
  return featureCandidates.some(candidate => actionCandidates.has(candidate));
}
