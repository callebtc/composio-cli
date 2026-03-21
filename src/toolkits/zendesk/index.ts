import { defineToolkit } from "../shared.js";

export const zendeskToolkit = defineToolkit({
  directoryName: "zendesk",
  cliName: "zendesk",
  apiSlug: "zendesk",
  displayName: "Zendesk",
  summary: "tickets, users, search",
  capabilities: ["tickets", "users", "search"],
  examples: ["search-tickets", "list-users", "get-ticket"],
  readCheckActions: ["search-tickets", "list-users"],
});

