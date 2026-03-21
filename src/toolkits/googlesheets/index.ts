import { defineToolkit } from "../shared.js";

export const googleSheetsToolkit = defineToolkit({
  directoryName: "googlesheets",
  cliName: "google-sheets",
  apiSlug: "googlesheets",
  displayName: "Google Sheets",
  summary: "read, write, append, batch update",
  capabilities: ["read", "write", "append", "batch update"],
  examples: ["values-get", "values-update", "spreadsheets-values-append"],
  readCheckActions: ["read-sheet"],
  aliases: ["googlesheets", "sheets"],
  featuredActions: [
    {
      canonical: "values-get",
      priority: 100,
      shortHelp: "Read a range of cells from a sheet.",
    },
    {
      canonical: "values-update",
      priority: 90,
      shortHelp: "Write values into a target cell range.",
    },
    {
      canonical: "spreadsheets-values-append",
      priority: 80,
      shortHelp: "Append rows to the end of a sheet.",
    },
    {
      canonical: "batch-update",
      priority: 70,
      shortHelp: "Apply multiple sheet mutations in one request.",
    },
    {
      canonical: "get-sheet-names",
      priority: 60,
      shortHelp: "See available tabs before reading or writing.",
    },
    {
      canonical: "batch-get",
      priority: 50,
      shortHelp: "Read multiple ranges in one request.",
    },
    {
      canonical: "get-spreadsheet-info",
      priority: 40,
      shortHelp: "Inspect spreadsheet metadata and sheet structure.",
    },
    {
      canonical: "find-worksheet-by-title",
      priority: 30,
      shortHelp: "Resolve a sheet tab by its title.",
    },
    {
      canonical: "search-spreadsheets",
      priority: 20,
      shortHelp: "Search for spreadsheets by name.",
    },
    {
      canonical: "upsert-rows",
      priority: 10,
      shortHelp: "Insert or update rows by key fields.",
    },
  ],
});
