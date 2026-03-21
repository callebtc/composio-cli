import { defineToolkit } from "../shared.js";

export const slackToolkit = defineToolkit({
  directoryName: "slack",
  cliName: "slack",
  apiSlug: "slack",
  displayName: "Slack",
  summary: "send message, list/join channels, edit messages",
  capabilities: ["messages", "channels", "editing"],
  examples: ["send-message", "list-channels", "join-channel"],
  readCheckActions: ["list-channels"],
});

