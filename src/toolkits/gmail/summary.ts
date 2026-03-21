import { CLI_NAME } from "../../constants.js";
import type { ToolkitAction } from "../../types.js";
import { buildReplayCommand, findInputProperty } from "../follow-up.js";
import { formatSummaryModeSuffix, resolveRequestedSummaryFields } from "../summary-fields.js";
import type { ToolkitOutputSummary, ToolkitSummaryRenderInput } from "../shared.js";
import { truncate } from "../../utils/strings.js";

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

export const gmailOutputSummary: ToolkitOutputSummary = {
  hasSummaryDefault(action: ToolkitAction): boolean {
    return GMAIL_SUMMARY_ACTIONS.has(action.slug);
  },
  renderExecutionResult(result: ToolkitSummaryRenderInput): string | undefined {
    if (!result.execution.successful || !GMAIL_SUMMARY_ACTIONS.has(result.action.slug)) {
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
  },
};

function renderGmailMessagesSummary(
  result: ToolkitSummaryRenderInput,
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
    `Summary: ${messages.length} message${messages.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
  ];

  const resultSizeEstimate = asNumber(data.resultSizeEstimate);
  if (resultSizeEstimate !== undefined) {
    lines.push(`Result size estimate: ${resultSizeEstimate}`);
  }
  const nextPageToken = asString(data.nextPageToken);
  if (nextPageToken) {
    lines.push(`Next page token: ${nextPageToken}`);
    const pageTokenKey = findInputProperty(result.action.inputSchema, [
      "page_token",
      "pageToken",
      "next_page_token",
      "nextPageToken",
    ]);
    if (pageTokenKey) {
      lines.push(
        `Next page: ${buildReplayCommand(result, {
          [pageTokenKey]: nextPageToken,
        })}`
      );
    }
  }
  lines.push("");

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "message-id",
        aliases: ["id", "messageId", "message_id"],
        label: "Message ID",
        value: (message: Record<string, unknown>) => asString(message.messageId) ?? asString(message.id),
      },
      {
        key: "sender",
        aliases: ["from"],
        label: "From",
        value: (message: Record<string, unknown>) =>
          asString(message.sender) ?? getHeader(message, "From"),
      },
      {
        key: "subject",
        label: "Subject",
        value: (message: Record<string, unknown>) =>
          asString(message.subject) ??
          asString(asRecord(message.preview)?.subject) ??
          getHeader(message, "Subject"),
      },
      {
        key: "date",
        aliases: ["timestamp"],
        label: "Date",
        value: (message: Record<string, unknown>) =>
          asString(message.messageTimestamp) ??
          asString(message.internalDate) ??
          getHeader(message, "Date"),
      },
      {
        key: "labels",
        aliases: ["label-ids"],
        label: "Labels",
        value: (message: Record<string, unknown>) => {
          const labels = asStringArray(message.labelIds);
          return labels.length > 0 ? labels.join(", ") : "(none)";
        },
      },
      {
        key: "preview",
        aliases: ["snippet"],
        label: "Preview",
        value: (message: Record<string, unknown>) =>
          truncate(
            normalizePreview(
              asString(asRecord(message.preview)?.body) ??
                asString(message.snippet) ??
                asString(message.messageText) ??
                ""
            ),
            100
          ) || "(empty)",
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${messageId}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(message) ?? "(empty)"}`);
      });
      return;
    }

    lines.push(`${index + 1}. ${messageId}`);
    lines.push(`   From: ${sender}`);
    lines.push(`   Subject: ${subject}`);
    lines.push(`   Date: ${timestamp}`);
    lines.push(`   Labels: ${labels.length > 0 ? labels.join(", ") : "(none)"}`);
    lines.push(`   Preview: ${preview || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --full for the standard text summary or --json for the full response.");
  lines.push(
    `Read one full message: ${CLI_NAME} gmail fetch-message-by-message-id --message-id ${asString(messages[0]?.messageId) ?? "<message-id>"} --api-key <key> --json`
  );
  lines.push("");
  return lines.join("\n");
}

function renderGmailThreadsSummary(
  result: ToolkitSummaryRenderInput,
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
    `Summary: ${threads.length} thread${threads.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
    "",
  ];

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "thread-id",
        aliases: ["id"],
        label: "Thread ID",
        value: (thread: Record<string, unknown>) => asString(thread.threadId) ?? asString(thread.id),
      },
      {
        key: "subject",
        label: "Subject",
        value: (thread: Record<string, unknown>) =>
          asString(thread.subject) ??
          asString(asRecord(thread.preview)?.subject) ??
          firstNestedMessageSubject(thread),
      },
      {
        key: "messages",
        aliases: ["message-count"],
        label: "Messages",
        value: (thread: Record<string, unknown>) => {
          const count = asRecordArray(thread.messages)?.length;
          return count !== undefined ? String(count) : undefined;
        },
      },
      {
        key: "preview",
        aliases: ["snippet"],
        label: "Preview",
        value: (thread: Record<string, unknown>) =>
          truncate(
            normalizePreview(
              asString(thread.snippet) ??
                asString(asRecord(thread.preview)?.body) ??
                firstNestedMessagePreview(thread) ??
                ""
            ),
            100
          ) || "(empty)",
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${threadId}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(thread) ?? "(empty)"}`);
      });
      return;
    }

    lines.push(`${index + 1}. ${threadId}`);
    lines.push(`   Subject: ${subject}`);
    if (messageCount !== undefined) {
      lines.push(`   Messages: ${messageCount}`);
    }
    lines.push(`   Preview: ${truncate(normalizePreview(preview), 100) || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --full for the standard text summary or --json for the full response.");
  lines.push(
    `Read one full thread: ${CLI_NAME} gmail fetch-message-by-thread-id --thread-id ${asString(threads[0]?.threadId) ?? asString(threads[0]?.id) ?? "<thread-id>"} --api-key <key> --json`
  );
  lines.push("");
  return lines.join("\n");
}

function renderGmailDraftsSummary(
  result: ToolkitSummaryRenderInput,
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
    `Summary: ${drafts.length} draft${drafts.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
    "",
  ];

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "draft-id",
        aliases: ["id"],
        label: "Draft ID",
        value: (draft: Record<string, unknown>) => asString(draft.id),
      },
      {
        key: "to",
        label: "To",
        value: (draft: Record<string, unknown>) => {
          const message = asRecord(draft.message) ?? draft;
          return asString(message.to) ?? getHeader(message, "To");
        },
      },
      {
        key: "subject",
        label: "Subject",
        value: (draft: Record<string, unknown>) => {
          const message = asRecord(draft.message) ?? draft;
          return (
            asString(message.subject) ??
            getHeader(message, "Subject") ??
            asString(asRecord(message.preview)?.subject)
          );
        },
      },
      {
        key: "preview",
        label: "Preview",
        value: (draft: Record<string, unknown>) => {
          const message = asRecord(draft.message) ?? draft;
          return (
            truncate(
              normalizePreview(
                asString(asRecord(message.preview)?.body) ??
                  asString(message.snippet) ??
                  asString(message.messageText) ??
                  ""
              ),
              100
            ) || "(empty)"
          );
        },
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${draftId}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(draft) ?? "(empty)"}`);
      });
      return;
    }

    lines.push(`${index + 1}. ${draftId}`);
    lines.push(`   To: ${to}`);
    lines.push(`   Subject: ${subject}`);
    lines.push(`   Preview: ${truncate(normalizePreview(preview), 100) || "(empty)"}`);
  });

  lines.push("");
  lines.push("Use --full for the standard text summary or --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderGmailLabelsSummary(
  result: ToolkitSummaryRenderInput,
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
    `Summary: ${labels.length} label${labels.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
    "",
  ];

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "label-id",
        aliases: ["id"],
        label: "Label ID",
        value: (label: Record<string, unknown>) => asString(label.id),
      },
      {
        key: "name",
        label: "Name",
        value: (label: Record<string, unknown>) => asString(label.name),
      },
      {
        key: "type",
        label: "Type",
        value: (label: Record<string, unknown>) => asString(label.type),
      },
    ],
    result.display.fields
  );

  labels.forEach((label, index) => {
    const id = asString(label.id) ?? "unknown";
    const name = asString(label.name) ?? "(unnamed)";
    const type = asString(label.type) ?? "unknown";

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${id}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(label) ?? "(empty)"}`);
      });
      return;
    }

    lines.push(`${index + 1}. ${name} (${id})`);
    lines.push(`   Type: ${type}`);
  });

  lines.push("");
  lines.push("Use --full for the standard text summary or --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderGmailPeopleSummary(
  result: ToolkitSummaryRenderInput,
  data: Record<string, unknown>
): string | undefined {
  const people = pickRecordArray(data, "people", "contacts", "results", "items") ?? undefined;
  if (!people) {
    return undefined;
  }
  if (people.length === 0) {
    return renderEmptySummary(result, "No contacts found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${people.length} contact${people.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
    "",
  ];

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "name",
        label: "Name",
        value: (person: Record<string, unknown>) =>
          asString(person.name) ??
          asString(person.displayName) ??
          asString(firstArrayValue(person.names, "displayName")),
      },
      {
        key: "email",
        aliases: ["email-address"],
        label: "Email",
        value: (person: Record<string, unknown>) =>
          asString(person.email) ??
          asString(person.emailAddress) ??
          asString(firstArrayValue(person.emailAddresses, "value")),
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${email}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(person) ?? "(empty)"}`);
      });
      return;
    }

    lines.push(`${index + 1}. ${name}`);
    lines.push(`   Email: ${email}`);
  });

  lines.push("");
  lines.push("Use --full for the standard text summary or --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderEmptySummary(result: ToolkitSummaryRenderInput, message: string): string {
  return [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    message,
    "",
    "Use --full for the standard text summary or --json for the full response.",
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
    ? (value.filter(
        item => typeof item === "object" && item !== null && !Array.isArray(item)
      ) as Array<Record<string, unknown>>)
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
