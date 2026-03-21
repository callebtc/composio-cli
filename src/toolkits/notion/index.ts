import { defineToolkit } from "../shared.js";

export const notionToolkit = defineToolkit({
  directoryName: "notion",
  cliName: "notion",
  apiSlug: "notion",
  displayName: "Notion",
  summary: "create/edit/search pages, databases",
  capabilities: ["pages", "databases", "search"],
  examples: ["search-notion-page", "create-notion-page", "query-database"],
  readCheckActions: ["search-pages", "search-databases"],
  featuredActions: [
    {
      canonical: "search-notion-page",
      priority: 100,
      shortHelp: "Search pages by title or text.",
    },
    {
      canonical: "retrieve-page",
      priority: 90,
      shortHelp: "Read one page after you have its page ID.",
    },
    {
      canonical: "create-notion-page",
      priority: 80,
      shortHelp: "Create a new page in Notion.",
    },
    {
      canonical: "query-database",
      priority: 70,
      shortHelp: "List or filter rows in a database.",
    },
    {
      canonical: "upsert-row-database",
      priority: 60,
      shortHelp: "Create or update a database row.",
    },
    {
      canonical: "fetch-block-contents",
      priority: 50,
      shortHelp: "Read the blocks inside a page or block.",
    },
    {
      canonical: "update-page",
      priority: 40,
      shortHelp: "Update page properties like title or status.",
    },
    {
      canonical: "fetch-database",
      priority: 30,
      shortHelp: "Inspect one database and its schema.",
    },
    {
      canonical: "fetch-row",
      priority: 20,
      shortHelp: "Retrieve one database row by ID.",
    },
    {
      canonical: "insert-row-database",
      priority: 10,
      shortHelp: "Insert a new row into a Notion database.",
    },
  ],
});
