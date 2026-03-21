import { defineToolkit } from "../shared.js";

export const salesforceToolkit = defineToolkit({
  directoryName: "salesforce",
  cliName: "salesforce",
  apiSlug: "salesforce",
  displayName: "Salesforce",
  summary: "leads, contacts",
  capabilities: ["leads", "contacts"],
  examples: ["search-contacts", "create-contact", "create-lead"],
  readCheckActions: ["list-leads", "list-contacts"],
  featuredActions: [
    {
      canonical: "search-contacts",
      priority: 100,
      shortHelp: "Find contacts by name or criteria.",
    },
    {
      canonical: "search-leads",
      priority: 90,
      shortHelp: "Find leads before creating duplicates.",
    },
    {
      canonical: "get-contact",
      priority: 80,
      shortHelp: "Read one contact record.",
    },
    {
      canonical: "create-contact",
      priority: 70,
      shortHelp: "Create a new contact.",
    },
    {
      canonical: "create-lead",
      priority: 60,
      shortHelp: "Create a new lead.",
    },
  ],
});
