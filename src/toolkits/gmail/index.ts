import { defineToolkit } from "../shared.js";

export const gmailToolkit = defineToolkit({
  directoryName: "gmail",
  cliName: "gmail",
  apiSlug: "gmail",
  displayName: "Gmail",
  summary: "send, fetch, draft, search, labels, threads, attachments",
  capabilities: ["send", "fetch", "draft", "search", "labels", "threads", "attachments"],
  examples: ["fetch-emails", "list-labels", "list-threads"],
  readCheckActions: ["list-labels", "fetch-emails", "list-threads"],
});

