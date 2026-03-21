import { defineToolkit } from "../shared.js";
import { gmailOutputSummary } from "./summary.js";

export const gmailToolkit = defineToolkit({
  directoryName: "gmail",
  cliName: "gmail",
  apiSlug: "gmail",
  displayName: "Gmail",
  summary: "send, fetch, draft, search, labels, threads, attachments",
  capabilities: ["send", "fetch", "draft", "search", "labels", "threads", "attachments"],
  examples: ["fetch-emails", "search-emails", "create-email-draft"],
  readCheckActions: ["list-labels", "fetch-emails", "list-threads"],
  featuredActions: [
    {
      canonical: "fetch-emails",
      priority: 100,
      shortHelp: "Read recent inbox messages with compact summaries.",
    },
    {
      canonical: "search-emails",
      priority: 90,
      shortHelp: "Search Gmail by query before reading full messages.",
    },
    {
      canonical: "create-email-draft",
      priority: 80,
      shortHelp: "Prepare an email draft without sending it yet.",
    },
    {
      canonical: "send-email",
      priority: 70,
      shortHelp: "Send an email when the content is ready.",
    },
    {
      canonical: "fetch-message-by-message-id",
      priority: 60,
      shortHelp: "Read one full message after choosing a message ID.",
    },
  ],
  outputSummary: gmailOutputSummary,
});
