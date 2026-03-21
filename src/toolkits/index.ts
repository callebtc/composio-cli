import type { ToolkitDefinition } from "./shared.js";
import { defineToolkit } from "./shared.js";
import { normalizeToken, titleCaseWords, toKebabCase } from "../utils/strings.js";
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

export function buildRuntimeToolkit(apiSlug: string): ToolkitDefinition {
  return (
    getSupportedToolkitByApiSlug(apiSlug) ??
    defineToolkit({
      directoryName: normalizeToken(apiSlug).replace(/-/g, ""),
      cliName: toKebabCase(formatRuntimeToolkitDisplayName(apiSlug)),
      apiSlug,
      displayName: formatRuntimeToolkitDisplayName(apiSlug),
      summary: "live-discovered connected toolkit",
      capabilities: ["live-discovered actions"],
      examples: [],
      readCheckActions: [],
    })
  );
}

function formatRuntimeToolkitDisplayName(apiSlug: string): string {
  const spaced = apiSlug
    .replace(/^google(?=[a-z])/, "google ")
    .replace(/^composio(?=[a-z])/, "composio ")
    .replace(/^discord(?=bot)/, "discord ")
    .replace(/[_-]+/g, " ");
  return titleCaseWords(spaced);
}
