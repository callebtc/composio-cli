import { defineToolkit } from "../shared.js";

export const discordToolkit = defineToolkit({
  directoryName: "discord",
  cliName: "discord",
  apiSlug: "discord",
  displayName: "Discord",
  summary: "messages, webhooks, channels",
  capabilities: ["messages", "webhooks", "channels"],
  examples: ["list-channels", "send-message", "create-webhook"],
  readCheckActions: ["list-channels"],
});

