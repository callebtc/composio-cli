import { defineToolkit } from "../shared.js";

export const hubspotToolkit = defineToolkit({
  directoryName: "hubspot",
  cliName: "hubspot",
  apiSlug: "hubspot",
  displayName: "HubSpot",
  summary: "contacts, deals, pipelines",
  capabilities: ["contacts", "deals", "pipelines"],
  examples: ["list-contacts", "search-contacts-by-criteria", "create-deal"],
  readCheckActions: ["list-contacts", "list-deals"],
  featuredActions: [
    {
      canonical: "list-contacts",
      priority: 100,
      shortHelp: "Browse contacts in the CRM.",
    },
    {
      canonical: "search-contacts-by-criteria",
      priority: 90,
      shortHelp: "Find contacts by filters or query.",
    },
    {
      canonical: "list-deals",
      priority: 80,
      shortHelp: "List deals in the pipeline.",
    },
    {
      canonical: "create-contact",
      priority: 70,
      shortHelp: "Create a new contact record.",
    },
    {
      canonical: "create-deal",
      priority: 60,
      shortHelp: "Create a new deal.",
    },
    {
      canonical: "read-contact",
      priority: 50,
      shortHelp: "Read one contact record.",
    },
    {
      canonical: "get-deal",
      priority: 40,
      shortHelp: "Read one deal record.",
    },
    {
      canonical: "search-deals",
      priority: 30,
      shortHelp: "Search deals by filters or criteria.",
    },
    {
      canonical: "update-contact",
      priority: 20,
      shortHelp: "Update an existing contact.",
    },
    {
      canonical: "update-deal",
      priority: 10,
      shortHelp: "Update an existing deal.",
    },
  ],
});
