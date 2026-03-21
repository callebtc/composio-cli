import type { ToolkitDefinition } from "./shared.js";
import { normalizeToken } from "../utils/strings.js";
import { gmailToolkit } from "./gmail/index.js";
import { googleCalendarToolkit } from "./googlecalendar/index.js";
import { googleDriveToolkit } from "./googledrive/index.js";
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
  googleDriveToolkit,
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

export function resolveToolkit(token: string): ToolkitDefinition | undefined {
  const normalized = normalizeToken(token);
  return SUPPORTED_TOOLKITS.find(toolkit =>
    toolkit.aliases.some(alias => normalizeToken(alias) === normalized)
  );
}

