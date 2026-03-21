import { defineToolkit } from "../shared.js";

export const composioSearchToolkit = defineToolkit({
  directoryName: "composiosearch",
  cliName: "composio-search",
  apiSlug: "composio_search",
  toolPrefix: "COMPOSIO_SEARCH",
  displayName: "Composio Search",
  summary: "web, news, scholar, maps, trends, fetch URL",
  capabilities: ["web", "news", "scholar", "maps", "trends", "fetch URL"],
  examples: ["web", "news", "fetch-url-content"],
  readCheckActions: ["web-search", "fetch-url"],
  aliases: ["composiosearch", "composio_search", "search"],
  featuredActions: [
    {
      canonical: "web",
      priority: 100,
      shortHelp: "Search the web for broad research tasks.",
    },
    {
      canonical: "news",
      priority: 90,
      shortHelp: "Search recent news articles.",
    },
    {
      canonical: "fetch-url-content",
      priority: 80,
      shortHelp: "Fetch clean readable content from a URL.",
    },
    {
      canonical: "scholar",
      priority: 70,
      shortHelp: "Search academic papers and citations.",
    },
    {
      canonical: "google-maps",
      priority: 60,
      shortHelp: "Search places and local business results.",
    },
    {
      canonical: "finance",
      priority: 50,
      shortHelp: "Look up financial prices and market data.",
    },
    {
      canonical: "image",
      priority: 40,
      shortHelp: "Search for images related to a query.",
    },
    {
      canonical: "trends",
      priority: 30,
      shortHelp: "Inspect search trends and relative interest.",
    },
    {
      canonical: "shopping",
      priority: 20,
      shortHelp: "Search products and prices across retailers.",
    },
    {
      canonical: "event",
      priority: 10,
      shortHelp: "Search for upcoming local or virtual events.",
    },
  ],
});
