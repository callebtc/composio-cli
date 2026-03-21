import { defineToolkit } from "../shared.js";

export const notionToolkit = defineToolkit({
  directoryName: "notion",
  cliName: "notion",
  apiSlug: "notion",
  displayName: "Notion",
  summary: "create/edit/search pages, databases",
  capabilities: ["pages", "databases", "search"],
  examples: ["search-pages", "create-page", "search-databases"],
  readCheckActions: ["search-pages", "search-databases"],
});

