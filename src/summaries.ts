import { CLI_NAME } from "./constants.js";
import type { ExecuteActionResult, ToolkitAction } from "./types.js";
import type { ToolkitDefinition } from "./toolkits/shared.js";
import { truncate } from "./utils/strings.js";

const GMAIL_SUMMARY_ACTIONS = new Set([
  "GMAIL_FETCH_EMAILS",
  "GMAIL_FETCH_MESSAGE_BY_THREAD_ID",
  "GMAIL_LIST_THREADS",
  "GMAIL_LIST_DRAFTS",
  "GMAIL_LIST_LABELS",
  "GMAIL_GET_CONTACTS",
  "GMAIL_GET_PEOPLE",
  "GMAIL_SEARCH_PEOPLE",
]);

export function hasSummaryDefault(toolkit: ToolkitDefinition, action: ToolkitAction): boolean {
  return toolkit.apiSlug === "gmail" && GMAIL_SUMMARY_ACTIONS.has(action.slug);
}

export function renderSummarizedExecutionResult(result: {
  action: ToolkitAction;
  toolkit: ToolkitDefinition;
  execution: ExecuteActionResult;
}): string | undefined {
  if (!result.execution.successful) {
    return undefined;
  }
  if (result.toolkit.apiSlug !== "gmail") {
    return undefined;
  }
  if (!GMAIL_SUMMARY_ACTIONS.has(result.action.slug)) {
    return undefined;
  }

  const data = asRecord(result.execution.data);
  if (!data) {
    return undefined;
  }

  switch (result.action.slug) {
    case "GMAIL_FETCH_EMAILS":
    case "GMAIL_FETCH_MESSAGE_BY_THREAD_ID":
      return renderGmailMessagesSummary(result, data);
    case "GMAIL_LIST_THREADS":
      return renderGmailThreadsSummary(result, data);
    case "GMAIL_LIST_DRAFTS":
      return renderGmailDraftsSummary(result, data);
    case "GMAIL_LIST_LABELS":
      return renderGmailLabelsSummary(result, data);
    case "GMAIL_GET_CONTACTS":
    case "GMAIL_GET_PEOPLE":
    case "GMAIL_SEARCH_PEOPLE":
      return renderGmailPeopleSummary(result, data);
    default:
      return undefined;
  }
}

function renderGmailMessagesSummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
    execution: ExecuteActionResult;
  },
  data: Record<string, unknown>
): string | undefined {
  const messages = pickRecordArray(data, "messages", "results", "items");
  if (!messages) {
    return undefined;
  }
  if (messages.length === 0) {
    return renderEmptySummary(result, "No messages found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${messages.length} message${messages.length === 1 ? "" : "s"}`,
  ];

  const resultSizeEstimate = asNumber(data.resultSizeEstimate);
  if (resultSizeEstimate !== undefined) {
    lines.push(`Result size estimate: ${resultSizeEstimate}`);
  }
  const nextPageToken = asString(data.nextPageToken);
  if (nextPageToken) {
    lines.push(`Next page token: ${nextPageToken}`);
  }
  lines.push("");

  messages.forEach((message, index) => {
    const messageId = asString(message.messageId) ?? asString(message.id) ?? "unknown";
    const sender = asString(message.sender) ?? getHeader(message, "From") ?? "unknown";
    const subject =
      asString(message.subject) ??
      asString(asRecord(message.preview)?.subject) ??
      getHeader(message, "Subject") ??
      "(no subject)";
    const timestamp =
      asString(message.messageTimestamp) ??
      asString(message.internalDate) ??
      getHeader(message, "Date") ??
      "unknown";
    const labels = asStringArray(message.labelIds);
    const previewSource =
      asString(asRecord(message.preview)?.body) ??
      asString(message.snippet) ??
      asString(message.messageText) ??
      "";
    const preview = truncate(normalizePreview(previewSource), 100);

    lines.push(`${index + 1}. ${messageId}`);
    lines.push(`   From: ${sender}`);
    lines.push(`   Subject: ${subject}`);
    lines.push(`   Date: ${timestamp}`);
    lines.push(`   Labels: ${labels.length > 0 ? labels.join(", ") : "(none)"}`);
    lines.push(`   Preview: ${preview || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push(
    `Read one full message: ${CLI_NAME} gmail fetch-message-by-message-id --message-id ${asString(messages[0]?.messageId) ?? "<message-id>"} --api-key <key> --json`
  );
  lines.push("");
  return lines.join("\n");
}

function renderGmailThreadsSummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
    execution: ExecuteActionResult;
  },
  data: Record<string, unknown>
): string | undefined {
  const threads = pickRecordArray(data, "threads", "results", "items");
  if (!threads) {
    return undefined;
  }
  if (threads.length === 0) {
    return renderEmptySummary(result, "No threads found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${threads.length} thread${threads.length === 1 ? "" : "s"}`,
    "",
  ];

  threads.forEach((thread, index) => {
    const threadId = asString(thread.threadId) ?? asString(thread.id) ?? "unknown";
    const subject =
      asString(thread.subject) ??
      asString(asRecord(thread.preview)?.subject) ??
      firstNestedMessageSubject(thread) ??
      "(no subject)";
    const preview =
      asString(thread.snippet) ??
      asString(asRecord(thread.preview)?.body) ??
      firstNestedMessagePreview(thread) ??
      "";
    const messageCount = asRecordArray(thread.messages)?.length;

    lines.push(`${index + 1}. ${threadId}`);
    lines.push(`   Subject: ${subject}`);
    if (messageCount !== undefined) {
      lines.push(`   Messages: ${messageCount}`);
    }
    lines.push(`   Preview: ${truncate(normalizePreview(preview), 100) || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push(
    `Read one full thread: ${CLI_NAME} gmail fetch-message-by-thread-id --thread-id ${asString(threads[0]?.threadId) ?? asString(threads[0]?.id) ?? "<thread-id>"} --api-key <key> --json`
  );
  lines.push("");
  return lines.join("\n");
}

function renderGmailDraftsSummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
    execution: ExecuteActionResult;
  },
  data: Record<string, unknown>
): string | undefined {
  const drafts = pickRecordArray(data, "drafts", "results", "items");
  if (!drafts) {
    return undefined;
  }
  if (drafts.length === 0) {
    return renderEmptySummary(result, "No drafts found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${drafts.length} draft${drafts.length === 1 ? "" : "s"}`,
    "",
  ];

  drafts.forEach((draft, index) => {
    const message = asRecord(draft.message) ?? draft;
    const draftId = asString(draft.id) ?? "unknown";
    const subject =
      asString(message.subject) ??
      getHeader(message, "Subject") ??
      asString(asRecord(message.preview)?.subject) ??
      "(no subject)";
    const to = asString(message.to) ?? getHeader(message, "To") ?? "(unknown)";
    const preview =
      asString(asRecord(message.preview)?.body) ??
      asString(message.snippet) ??
      asString(message.messageText) ??
      "";

    lines.push(`${index + 1}. ${draftId}`);
    lines.push(`   To: ${to}`);
    lines.push(`   Subject: ${subject}`);
    lines.push(`   Preview: ${truncate(normalizePreview(preview), 100) || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderGmailLabelsSummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
    execution: ExecuteActionResult;
  },
  data: Record<string, unknown>
): string | undefined {
  const labels = pickRecordArray(data, "labels", "results", "items");
  if (!labels) {
    return undefined;
  }
  if (labels.length === 0) {
    return renderEmptySummary(result, "No labels found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${labels.length} label${labels.length === 1 ? "" : "s"}`,
    "",
  ];

  labels.forEach((label, index) => {
    const id = asString(label.id) ?? "unknown";
    const name = asString(label.name) ?? "(unnamed)";
    const type = asString(label.type) ?? "unknown";
    lines.push(`${index + 1}. ${name} (${id})`);
    lines.push(`   Type: ${type}`);
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderGmailPeopleSummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
    execution: ExecuteActionResult;
  },
  data: Record<string, unknown>
): string | undefined {
  const people =
    pickRecordArray(data, "people", "contacts", "results", "items") ??
    undefined;
  if (!people) {
    return undefined;
  }
  if (people.length === 0) {
    return renderEmptySummary(result, "No contacts found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${people.length} contact${people.length === 1 ? "" : "s"}`,
    "",
  ];

  people.forEach((person, index) => {
    const name =
      asString(person.name) ??
      asString(person.displayName) ??
      asString(firstArrayValue(person.names, "displayName")) ??
      "(no name)";
    const email =
      asString(person.email) ??
      asString(person.emailAddress) ??
      asString(firstArrayValue(person.emailAddresses, "value")) ??
      "(no email)";
    lines.push(`${index + 1}. ${name}`);
    lines.push(`   Email: ${email}`);
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderEmptySummary(
  result: {
    action: ToolkitAction;
    toolkit: ToolkitDefinition;
  },
  message: string
): string {
  return [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    message,
    "",
    "Use --json for the full response.",
    "",
  ].join("\n");
}

function getHeader(message: Record<string, unknown>, name: string): string | undefined {
  const headers = asRecordArray(asRecord(message.payload)?.headers);
  const entry = headers?.find(header => asString(header.name)?.toLowerCase() === name.toLowerCase());
  return asString(entry?.value);
}

function firstNestedMessageSubject(thread: Record<string, unknown>): string | undefined {
  const firstMessage = asRecordArray(thread.messages)?.[0];
  return firstMessage
    ? asString(firstMessage.subject) ??
        asString(asRecord(firstMessage.preview)?.subject) ??
        getHeader(firstMessage, "Subject")
    : undefined;
}

function firstNestedMessagePreview(thread: Record<string, unknown>): string | undefined {
  const firstMessage = asRecordArray(thread.messages)?.[0];
  return firstMessage
    ? asString(asRecord(firstMessage.preview)?.body) ??
        asString(firstMessage.snippet) ??
        asString(firstMessage.messageText)
    : undefined;
}

function firstArrayValue(value: unknown, key: string): unknown {
  const first = asRecordArray(value)?.[0];
  return first?.[key];
}

function normalizePreview(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function pickRecordArray(
  data: Record<string, unknown>,
  ...keys: string[]
): Array<Record<string, unknown>> | undefined {
  for (const key of keys) {
    const value = asRecordArray(data[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> | undefined {
  return Array.isArray(value)
    ? value.filter(item => typeof item === "object" && item !== null && !Array.isArray(item)) as Array<
        Record<string, unknown>
      >
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
}
