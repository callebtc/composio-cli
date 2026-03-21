import { defineToolkit } from "../shared.js";

export const salesforceToolkit = defineToolkit({
  directoryName: "salesforce",
  cliName: "salesforce",
  apiSlug: "salesforce",
  displayName: "Salesforce",
  summary: "leads, contacts",
  capabilities: ["leads", "contacts"],
  examples: ["list-leads", "list-contacts", "get-contact"],
  readCheckActions: ["list-leads", "list-contacts"],
});

