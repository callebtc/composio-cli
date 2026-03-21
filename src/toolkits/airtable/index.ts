import { defineToolkit } from "../shared.js";

export const airtableToolkit = defineToolkit({
  directoryName: "airtable",
  cliName: "airtable",
  apiSlug: "airtable",
  displayName: "Airtable",
  summary: "list/get/update records",
  capabilities: ["records", "tables", "bases"],
  examples: ["list-bases", "list-records", "create-record"],
  readCheckActions: ["list-records", "get-record"],
  featuredActions: [
    {
      canonical: "list-bases",
      priority: 100,
      shortHelp: "List bases available to the token.",
    },
    {
      canonical: "list-records",
      priority: 90,
      shortHelp: "Read records from a table.",
    },
    {
      canonical: "get-record",
      priority: 80,
      shortHelp: "Fetch one record by ID.",
    },
    {
      canonical: "create-record",
      priority: 70,
      shortHelp: "Create a new Airtable record.",
    },
    {
      canonical: "update-record",
      priority: 60,
      shortHelp: "Update fields on an existing record.",
    },
  ],
});
