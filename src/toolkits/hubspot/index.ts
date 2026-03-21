import { defineToolkit } from "../shared.js";

export const hubspotToolkit = defineToolkit({
  directoryName: "hubspot",
  cliName: "hubspot",
  apiSlug: "hubspot",
  displayName: "HubSpot",
  summary: "contacts, deals, pipelines",
  capabilities: ["contacts", "deals", "pipelines"],
  examples: ["list-contacts", "list-deals", "get-pipelines"],
  readCheckActions: ["list-contacts", "list-deals"],
});

