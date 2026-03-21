import { defineToolkit } from "../shared.js";

export const googleSheetsToolkit = defineToolkit({
  directoryName: "googlesheets",
  cliName: "google-sheets",
  apiSlug: "googlesheets",
  displayName: "Google Sheets",
  summary: "read, write, append, batch update",
  capabilities: ["read", "write", "append", "batch update"],
  examples: ["read-sheet", "append-values", "batch-update"],
  readCheckActions: ["read-sheet"],
  aliases: ["googlesheets", "sheets"],
});

