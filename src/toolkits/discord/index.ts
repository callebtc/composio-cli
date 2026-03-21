import { defineToolkit } from "../shared.js";

export const discordToolkit = defineToolkit({
  directoryName: "discord",
  cliName: "discord",
  apiSlug: "discord",
  displayName: "Discord",
  summary: "messages, webhooks, channels",
  capabilities: ["messages", "webhooks", "channels"],
  examples: ["list-my-guilds", "get-my-user", "get-invite"],
  readCheckActions: ["list-channels"],
  featuredActions: [
    {
      canonical: "list-my-guilds",
      priority: 100,
      shortHelp: "List guilds available to the current user.",
    },
    {
      canonical: "get-my-user",
      priority: 90,
      shortHelp: "Inspect the authenticated Discord user.",
    },
    {
      canonical: "get-user",
      priority: 80,
      shortHelp: "Look up another Discord user by ID.",
    },
    {
      canonical: "get-invite",
      priority: 70,
      shortHelp: "Resolve an invite before sharing or joining.",
    },
    {
      canonical: "list-my-connections",
      priority: 60,
      shortHelp: "List linked connections for the current user.",
    },
  ],
});
