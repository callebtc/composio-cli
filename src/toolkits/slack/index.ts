import { defineToolkit } from "../shared.js";

export const slackToolkit = defineToolkit({
  directoryName: "slack",
  cliName: "slack",
  apiSlug: "slack",
  displayName: "Slack",
  summary: "send message, list/join channels, edit messages",
  capabilities: ["messages", "channels", "editing"],
  examples: ["list-all-channels", "send-message", "fetch-conversation-history"],
  readCheckActions: ["list-channels"],
  featuredActions: [
    {
      canonical: "list-all-channels",
      priority: 100,
      shortHelp: "List channels before posting or joining.",
    },
    {
      canonical: "fetch-conversation-history",
      priority: 90,
      shortHelp: "Read recent channel history.",
    },
    {
      canonical: "send-message",
      priority: 80,
      shortHelp: "Post a message into a channel or DM.",
    },
    {
      canonical: "updates-a-slack-message",
      priority: 70,
      shortHelp: "Edit a previously sent Slack message.",
    },
    {
      canonical: "join-an-existing-conversation",
      priority: 60,
      shortHelp: "Join a public channel before participating.",
    },
  ],
});
