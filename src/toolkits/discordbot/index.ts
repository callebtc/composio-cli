import { defineToolkit } from "../shared.js";

export const discordBotToolkit = defineToolkit({
  directoryName: "discordbot",
  cliName: "discord-bot",
  apiSlug: "discordbot",
  displayName: "Discord Bot",
  summary: "messages, webhooks, channels",
  capabilities: ["messages", "webhooks", "channels"],
  examples: ["list-channels", "send-message", "create-webhook"],
  readCheckActions: ["list-channels"],
  aliases: ["discordbot"],
});

