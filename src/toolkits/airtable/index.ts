import { defineToolkit } from "../shared.js";

export const airtableToolkit = defineToolkit({
  directoryName: "airtable",
  cliName: "airtable",
  apiSlug: "airtable",
  displayName: "Airtable",
  summary: "list/get/update records",
  capabilities: ["records", "tables", "bases"],
  examples: ["list-records", "get-record", "update-record"],
  readCheckActions: ["list-records", "get-record"],
});

