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
    {
      canonical: "list-zendesk-users",
      priority: 50,
      shortHelp: "List users in Zendesk.",
    },
    {
      canonical: "search-zendesk-users",
      priority: 40,
      shortHelp: "Search for users by name or email.",
    },
    {
      canonical: "create-zendesk-user",
      priority: 30,
      shortHelp: "Create a new Zendesk user.",
    },
    {
      canonical: "update-zendesk-ticket",
      priority: 20,
      shortHelp: "Update ticket fields or status.",
    },
    {
      canonical: "get-all-zendesk-organizations",
      priority: 10,
      shortHelp: "List Zendesk organizations.",
    },
  ],
});
