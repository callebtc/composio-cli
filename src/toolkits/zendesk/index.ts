import { defineToolkit } from "../shared.js";

export const zendeskToolkit = defineToolkit({
  directoryName: "zendesk",
  cliName: "zendesk",
  apiSlug: "zendesk",
  displayName: "Zendesk",
  summary: "tickets, users, search",
  capabilities: ["tickets", "users", "search"],
  examples: ["search-zendesk", "list-zendesk-tickets", "create-zendesk-ticket"],
  readCheckActions: ["search-tickets", "list-users"],
  featuredActions: [
    {
      canonical: "search-zendesk",
      priority: 100,
      shortHelp: "Search tickets, users, and content.",
    },
    {
      canonical: "list-zendesk-tickets",
      priority: 90,
      shortHelp: "List tickets in the help desk.",
    },
    {
      canonical: "get-zendesk-ticket-by-id",
      priority: 80,
      shortHelp: "Read one ticket in detail.",
    },
    {
      canonical: "create-zendesk-ticket",
      priority: 70,
      shortHelp: "Create a new support ticket.",
    },
    {
      canonical: "reply-zendesk-ticket",
      priority: 60,
      shortHelp: "Reply to an existing ticket thread.",
    },
  ],
});
