import { defineToolkit } from "../shared.js";

export const composioSearchToolkit = defineToolkit({
  directoryName: "composiosearch",
  cliName: "composio-search",
  apiSlug: "composio_search",
  toolPrefix: "COMPOSIO_SEARCH",
  displayName: "Composio Search",
  summary: "web, news, scholar, maps, trends, fetch URL",
  capabilities: ["web", "news", "scholar", "maps", "trends", "fetch URL"],
  examples: ["web-search", "news-search", "fetch-url"],
  readCheckActions: ["web-search", "fetch-url"],
  aliases: ["composiosearch", "composio_search", "search"],
});

