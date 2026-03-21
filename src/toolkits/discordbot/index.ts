import { defineToolkit } from "../shared.js";

export const discordBotToolkit = defineToolkit({
  directoryName: "discordbot",
  cliName: "discord-bot",
  apiSlug: "discordbot",
  displayName: "Discord Bot",
  summary: "messages, webhooks, channels",
  capabilities: ["messages", "webhooks", "channels"],
  examples: ["list-guild-channels", "create-message", "create-webhook"],
  readCheckActions: ["list-channels"],
  aliases: ["discordbot"],
  featuredActions: [
    {
      canonical: "list-guild-channels",
      priority: 100,
      shortHelp: "List channels in a guild before posting.",
    },
    {
      canonical: "create-message",
      priority: 90,
      shortHelp: "Send a bot message to a channel.",
    },
    {
      canonical: "list-messages",
      priority: 80,
      shortHelp: "Read recent channel messages.",
    },
    {
      canonical: "update-message",
      priority: 70,
      shortHelp: "Edit a bot-authored message.",
    },
    {
      canonical: "create-webhook",
      priority: 60,
      shortHelp: "Create a webhook for channel delivery.",
    },
    {
      canonical: "get-channel",
      priority: 50,
      shortHelp: "Inspect one Discord channel.",
    },
    {
      canonical: "get-message",
      priority: 40,
      shortHelp: "Read one message by ID.",
    },
    {
      canonical: "delete-message",
      priority: 30,
      shortHelp: "Delete a bot-visible message.",
    },
    {
      canonical: "list-guild-members",
      priority: 20,
      shortHelp: "List members in a guild.",
    },
    {
      canonical: "get-guild",
      priority: 10,
      shortHelp: "Read guild metadata and settings.",
    },
  ],
});
