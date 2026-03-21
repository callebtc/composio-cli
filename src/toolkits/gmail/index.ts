import { defineToolkit } from "../shared.js";
import { gmailOutputSummary } from "./summary.js";

export const gmailToolkit = defineToolkit({
  directoryName: "gmail",
  cliName: "gmail",
  apiSlug: "gmail",
  displayName: "Gmail",
  summary: "send, fetch, draft, search, labels, threads, attachments",
  capabilities: ["send", "fetch", "draft", "search", "labels", "threads", "attachments"],
  examples: ["fetch-emails", "create-email-draft", "send-email"],
  readCheckActions: ["list-labels", "fetch-emails", "list-threads"],
  featuredActions: [
    {
      canonical: "fetch-emails",
      priority: 100,
      shortHelp: "Read recent inbox messages with compact summaries.",
    },
    {
      canonical: "fetch-message-by-message-id",
      priority: 90,
      shortHelp: "Read one full message after choosing a message ID.",
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
      canonical: "reply-to-thread",
      priority: 60,
      shortHelp: "Reply inside an existing Gmail thread.",
    },
    {
      canonical: "list-labels",
      priority: 50,
      shortHelp: "List Gmail labels and the IDs needed for filtering.",
    },
    {
      canonical: "list-threads",
      priority: 40,
      shortHelp: "Browse conversation threads instead of individual messages.",
    },
    {
      canonical: "list-drafts",
      priority: 30,
      shortHelp: "List saved drafts before editing or sending them.",
    },
    {
      canonical: "send-draft",
      priority: 20,
      shortHelp: "Send an existing draft as-is.",
    },
    {
      canonical: "get-contacts",
      priority: 10,
      shortHelp: "Look up saved Google contacts before composing mail.",
    },
  ],
  outputSummary: gmailOutputSummary,
});
