import type { FeaturedToolkitAction, ToolkitDefinition } from "./shared.js";
import { defineToolkit } from "./shared.js";
import type { ToolkitAction } from "../types.js";
import { normalizeToken, titleCaseWords, toKebabCase, truncate } from "../utils/strings.js";
import { gmailToolkit } from "./gmail/index.js";
import { googleCalendarToolkit } from "./googlecalendar/index.js";
import { googleDocsToolkit } from "./googledocs/index.js";
import { googleDriveToolkit } from "./googledrive/index.js";
import { googleMapsToolkit } from "./googlemaps/index.js";
import { googleSheetsToolkit } from "./googlesheets/index.js";
import { slackToolkit } from "./slack/index.js";
import { githubToolkit } from "./github/index.js";
import { notionToolkit } from "./notion/index.js";
import { linearToolkit } from "./linear/index.js";
import { hubspotToolkit } from "./hubspot/index.js";
import { jiraToolkit } from "./jira/index.js";
import { salesforceToolkit } from "./salesforce/index.js";
import { airtableToolkit } from "./airtable/index.js";
import { asanaToolkit } from "./asana/index.js";
import { trelloToolkit } from "./trello/index.js";
import { discordToolkit } from "./discord/index.js";
import { discordBotToolkit } from "./discordbot/index.js";
import { twitterToolkit } from "./twitter/index.js";
import { whatsappToolkit } from "./whatsapp/index.js";
import { stripeToolkit } from "./stripe/index.js";
import { zendeskToolkit } from "./zendesk/index.js";
import { dropboxToolkit } from "./dropbox/index.js";
import { figmaToolkit } from "./figma/index.js";
import { youtubeToolkit } from "./youtube/index.js";
import { spotifyToolkit } from "./spotify/index.js";
import { composioSearchToolkit } from "./composiosearch/index.js";

export const SUPPORTED_TOOLKITS: ToolkitDefinition[] = [
  gmailToolkit,
  googleCalendarToolkit,
  googleDocsToolkit,
  googleDriveToolkit,
  googleMapsToolkit,
  googleSheetsToolkit,
  slackToolkit,
  githubToolkit,
  notionToolkit,
  linearToolkit,
  hubspotToolkit,
  jiraToolkit,
  salesforceToolkit,
  airtableToolkit,
  asanaToolkit,
  trelloToolkit,
  discordToolkit,
  discordBotToolkit,
  twitterToolkit,
  whatsappToolkit,
  stripeToolkit,
  zendeskToolkit,
  dropboxToolkit,
  figmaToolkit,
  youtubeToolkit,
  spotifyToolkit,
  composioSearchToolkit,
];

export function resolveToolkit(
  token: string,
  toolkits: ToolkitDefinition[] = SUPPORTED_TOOLKITS
): ToolkitDefinition | undefined {
  const normalized = normalizeToken(token);
  return toolkits.find(toolkit =>
    toolkit.aliases.some(alias => normalizeToken(alias) === normalized)
  );
}

export function getSupportedToolkitByApiSlug(apiSlug: string): ToolkitDefinition | undefined {
  return SUPPORTED_TOOLKITS.find(toolkit => toolkit.apiSlug === apiSlug);
}

export function buildRuntimeToolkit(
  apiSlug: string,
  actions?: ToolkitAction[]
): ToolkitDefinition {
  return buildRuntimeToolkitDefinition(apiSlug, actions, getSupportedToolkitByApiSlug(apiSlug));
}

function buildRuntimeToolkitDefinition(
  apiSlug: string,
  actions: ToolkitAction[] = [],
  base?: ToolkitDefinition
): ToolkitDefinition {
  const displayName =
    base?.displayName ??
    actions.find(action => action.toolkitName)?.toolkitName ??
    formatRuntimeToolkitDisplayName(apiSlug);
  const rankedActions = [...actions].sort((left, right) => {
    const scoreDiff = scoreRuntimeAction(right) - scoreRuntimeAction(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return left.cliName.localeCompare(right.cliName);
  });
  const featuredActions = buildFeaturedActions(rankedActions, base);
  const capabilities =
    base?.capabilities.length
      ? base.capabilities
      : inferRuntimeCapabilities(rankedActions);
  const summary =
    base?.summary ??
    (capabilities.length > 0
      ? capabilities.slice(0, 4).join(", ")
      : `${rankedActions.length} discovered actions`);
  const readCheckActions = rankedActions
    .filter(action => isReadLikeRuntimeAction(action))
    .slice(0, 3)
    .map(action => action.cliName);

  return defineToolkit({
    directoryName: base?.directoryName ?? normalizeToken(apiSlug).replace(/-/g, ""),
    cliName: base?.cliName ?? toKebabCase(displayName),
    apiSlug,
    ...(base?.toolPrefix ? { toolPrefix: base.toolPrefix } : {}),
    displayName,
    summary,
    capabilities: capabilities.length > 0 ? capabilities : ["actions"],
    examples:
      rankedActions.length > 0
        ? rankedActions.slice(0, 3).map(action => action.cliName)
        : base?.examples ?? [],
    readCheckActions:
      base?.readCheckActions.length ? base.readCheckActions : (readCheckActions.length > 0 ? readCheckActions : []),
    featuredActions: featuredActions.length > 0 ? featuredActions : (base?.featuredActions ?? []),
    ...(base?.aliases ? { aliases: base.aliases } : {}),
    ...(base?.outputSummary ? { outputSummary: base.outputSummary } : {}),
  });
}

function formatRuntimeToolkitDisplayName(apiSlug: string): string {
  const spaced = apiSlug
    .replace(/^google(?=[a-z])/, "google ")
    .replace(/^composio(?=[a-z])/, "composio ")
    .replace(/^discord(?=bot)/, "discord ")
    .replace(/[_-]+/g, " ");
  return titleCaseWords(spaced);
}

function scoreRuntimeAction(action: ToolkitAction): number {
  const text = `${action.cliName} ${(action.description ?? "").toLowerCase()}`;
  const tokens = action.cliName.toLowerCase().split("-").filter(Boolean);
  const first = tokens[0] ?? "";
  const hasToken = (candidates: string[]) => candidates.some(candidate => tokens.includes(candidate));
  let score = 0;

  if (hasToken(["fetch", "search", "find", "lookup", "list", "get", "read"])) score += 100;
  if (hasToken(["create", "send", "post", "upload", "append", "write"])) score += 85;
  if (hasToken(["update", "patch", "edit", "replace", "move", "copy"])) score += 55;
  if (hasToken(["delete", "remove", "trash", "destroy", "stop"])) score -= 20;

  if (["fetch", "search", "find", "lookup", "list", "get", "read"].includes(first)) score += 20;
  if (["create", "send", "post", "upload", "append", "write"].includes(first)) score += 10;

  if (/\b(email|message|thread|document|doc|event|calendar|file|folder|sheet|spreadsheet|channel|issue|repo|page|database|task|project|contact|deal|ticket|record|board|card|place|route|video|playlist|invoice|lead)\b/.test(text)) {
    score += 60;
  }
  if (/\b(draft|attachment|label|photo|image|caption|calendar|calendars|playlist|branch|commit|pull|pr)\b/.test(text)) {
    score += 25;
  }
  if (/\b(settings?|config|history|smime|cse|forwarding|send-as|vacation|imap|pop|language|footer|header|footnote|named-range|bullets?|table|row|column|style|session|tile|watch)\b/.test(text)) {
    score -= 45;
  }
  if (/\bdeprecated\b/.test(text)) score -= 80;
  return score;
}

function buildFeaturedActions(
  rankedActions: ToolkitAction[],
  base?: ToolkitDefinition
): FeaturedToolkitAction[] {
  const matched = new Set<string>();
  const seeded = (base?.featuredActions ?? [])
    .map(feature => {
      const action = rankedActions.find(candidate => matchesFeatureCandidate(candidate, feature));
      if (!action) {
        return undefined;
      }
      matched.add(action.cliName);
      return {
        canonical: action.cliName,
        priority: feature.priority,
        shortHelp: summarizeRuntimeAction(action),
        ...(feature.aliases ? { aliases: feature.aliases } : {}),
      } satisfies FeaturedToolkitAction;
    })
    .filter((entry): entry is FeaturedToolkitAction => Boolean(entry));

  const inferred = rankedActions
    .filter(action => !matched.has(action.cliName))
    .slice(0, Math.max(0, 10 - seeded.length))
    .map(action => ({
      canonical: action.cliName,
      priority: scoreRuntimeAction(action),
      shortHelp: summarizeRuntimeAction(action),
    }) satisfies FeaturedToolkitAction);

  return [...seeded, ...inferred];
}

function matchesFeatureCandidate(action: ToolkitAction, feature: FeaturedToolkitAction): boolean {
  const actionCandidates = new Set(
    [action.cliName, action.slug, ...action.aliases].map(value => normalizeToken(value))
  );
  return [feature.canonical, ...(feature.aliases ?? [])]
    .map(value => normalizeToken(value))
    .some(value => actionCandidates.has(value));
}

function summarizeRuntimeAction(action: ToolkitAction): string {
  const description = action.description?.trim();
  if (!description) {
    return action.name;
  }
  const sentence = description.split(/(?<=[.!?])\s+/)[0] ?? description;
  return truncate(sentence, 80);
}

function inferRuntimeCapabilities(actions: ToolkitAction[]): string[] {
  const categories = [
    { label: "search", patterns: [/\bsearch\b/, /\bfind\b/, /\blookup\b/, /\bautocomplete\b/, /\bquery\b/] },
    { label: "read", patterns: [/\bget\b/, /\bfetch\b/, /\bread\b/, /\blist\b/, /\binspect\b/] },
    { label: "create", patterns: [/\bcreate\b/, /\bnew\b/, /\binsert\b/, /\badd\b/, /\bdraft\b/] },
    { label: "update", patterns: [/\bupdate\b/, /\bpatch\b/, /\bedit\b/, /\breplace\b/, /\bmove\b/, /\bcopy\b/] },
    { label: "send", patterns: [/\bsend\b/, /\bpost\b/] },
    { label: "delete", patterns: [/\bdelete\b/, /\bremove\b/, /\btrash\b/] },
    { label: "export", patterns: [/\bexport\b/, /\bdownload\b/] },
    { label: "media", patterns: [/\bimage\b/, /\bphoto\b/, /\bvideo\b/, /\baudio\b/, /\bmedia\b/] },
    { label: "documents", patterns: [/\bdocument\b/, /\bdocs?\b/] },
    { label: "places", patterns: [/\bplace\b/, /\bmaps?\b/, /\blocation\b/, /\broute\b/, /\bdirections?\b/, /\bgeocod/] },
    { label: "sheets", patterns: [/\bsheet\b/, /\bspreadsheet\b/, /\bworksheet\b/] },
    { label: "messages", patterns: [/\bmessage\b/, /\bthread\b/, /\bchat\b/, /\bconversation\b/] },
    { label: "files", patterns: [/\bfile\b/, /\bfolder\b/, /\bdrive\b/] },
    { label: "tickets", patterns: [/\bticket\b/, /\bissue\b/, /\bcase\b/] },
    { label: "tasks", patterns: [/\btask\b/, /\bproject\b/, /\bsection\b/] },
  ];

  const text = actions
    .slice(0, 20)
    .map(action => action.cliName.toLowerCase())
    .join(" ");

  return categories
    .filter(category => category.patterns.some(pattern => pattern.test(text)))
    .map(category => category.label);
}

function isReadLikeRuntimeAction(action: ToolkitAction): boolean {
  return /^(get|fetch|list|search|find|lookup|read|inspect)/i.test(action.cliName);
}
