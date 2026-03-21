import type { ToolkitAction } from "../../types.js";
import type { ToolkitOutputSummary, ToolkitSummaryRenderInput } from "../shared.js";

const CALENDAR_LIST_ACTIONS = new Set([
  "GOOGLECALENDAR_LIST_CALENDARS",
  "GOOGLECALENDAR_LIST_SETTINGS",
  "GOOGLECALENDAR_SETTINGS_LIST",
]);

const EVENT_LIST_ACTIONS = new Set([
  "GOOGLECALENDAR_FIND_EVENT",
  "GOOGLECALENDAR_EVENTS_LIST",
  "GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS",
  "GOOGLECALENDAR_EVENTS_INSTANCES",
  "GOOGLECALENDAR_SYNC_EVENTS",
]);

const FREE_BUSY_ACTIONS = new Set([
  "GOOGLECALENDAR_FIND_FREE_SLOTS",
  "GOOGLECALENDAR_FREE_BUSY_QUERY",
]);

export const googleCalendarOutputSummary: ToolkitOutputSummary = {
  hasSummaryDefault(action: ToolkitAction): boolean {
    return (
      CALENDAR_LIST_ACTIONS.has(action.slug) ||
      EVENT_LIST_ACTIONS.has(action.slug) ||
      FREE_BUSY_ACTIONS.has(action.slug)
    );
  },
  renderExecutionResult(result: ToolkitSummaryRenderInput): string | undefined {
    if (!result.execution.successful || !googleCalendarOutputSummary.hasSummaryDefault(result.action)) {
      return undefined;
    }

    const data = asRecord(result.execution.data);
    if (!data) {
      return undefined;
    }

    if (CALENDAR_LIST_ACTIONS.has(result.action.slug)) {
      return renderCalendarListSummary(result, data);
    }
    if (EVENT_LIST_ACTIONS.has(result.action.slug)) {
      return renderEventListSummary(result, data);
    }
    if (FREE_BUSY_ACTIONS.has(result.action.slug)) {
      return renderFreeBusySummary(result, data);
    }
    return undefined;
  },
};

function renderCalendarListSummary(
  result: ToolkitSummaryRenderInput,
  data: Record<string, unknown>
): string | undefined {
  const calendars = pickRecordArray(data, "calendars", "items", "settings");
  if (!calendars) {
    return undefined;
  }
  if (calendars.length === 0) {
    return renderEmptySummary(result, "No calendars found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${calendars.length} calendar${calendars.length === 1 ? "" : "s"}`,
    "",
  ];

  calendars.forEach((calendar, index) => {
    const id = asString(calendar.id) ?? asString(calendar.calendarId) ?? "unknown";
    const name =
      asString(calendar.summaryOverride) ??
      asString(calendar.summary) ??
      asString(calendar.displayName) ??
      "(unnamed)";
    const accessRole = asString(calendar.accessRole);
    const timeZone = asString(calendar.timeZone);
    const selected = asBoolean(calendar.selected);
    const primary = asBoolean(calendar.primary);

    lines.push(`${index + 1}. ${name}`);
    lines.push(`   Calendar ID: ${id}`);
    if (accessRole) {
      lines.push(`   Access: ${accessRole}`);
    }
    if (timeZone) {
      lines.push(`   Time zone: ${timeZone}`);
    }
    lines.push(`   Selected: ${selected === undefined ? "unknown" : selected ? "yes" : "no"}`);
    if (primary !== undefined) {
      lines.push(`   Primary: ${primary ? "yes" : "no"}`);
    }
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderEventListSummary(
  result: ToolkitSummaryRenderInput,
  data: Record<string, unknown>
): string | undefined {
  const events = pickRecordArray(data, "items", "events", "event_data");
  if (!events) {
    return undefined;
  }
  if (events.length === 0) {
    return renderEmptySummary(result, "No events found.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${events.length} event${events.length === 1 ? "" : "s"}`,
  ];

  const nextPageToken = asString(data.nextPageToken);
  if (nextPageToken) {
    lines.push(`Next page token: ${nextPageToken}`);
  }
  const nextSyncToken = asString(data.nextSyncToken);
  if (nextSyncToken) {
    lines.push(`Next sync token: ${nextSyncToken}`);
  }
  lines.push("");

  events.forEach((event, index) => {
    const id = asString(event.id) ?? "unknown";
    const summary = asString(event.summary) ?? "(no title)";
    const status = asString(event.status) ?? "unknown";
    const start = formatCalendarTime(asRecord(event.start));
    const end = formatCalendarTime(asRecord(event.end));
    const organizer =
      asString(asRecord(event.organizer)?.email) ??
      asString(asRecord(event.creator)?.email) ??
      "unknown";
    const attendeeCount = asRecordArray(event.attendees)?.length;
    const location = asString(event.location);

    lines.push(`${index + 1}. ${summary}`);
    lines.push(`   Event ID: ${id}`);
    lines.push(`   Status: ${status}`);
    lines.push(`   Start: ${start}`);
    lines.push(`   End: ${end}`);
    lines.push(`   Organizer: ${organizer}`);
    if (attendeeCount !== undefined) {
      lines.push(`   Attendees: ${attendeeCount}`);
    }
    if (location) {
      lines.push(`   Location: ${location}`);
    }
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderFreeBusySummary(
  result: ToolkitSummaryRenderInput,
  data: Record<string, unknown>
): string | undefined {
  const calendars = asRecord(data.calendars);
  if (!calendars) {
    return undefined;
  }

  const entries = Object.entries(calendars)
    .map(([calendarId, value]) => [calendarId, asRecord(value)] as const)
    .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry[1]));

  if (entries.length === 0) {
    return renderEmptySummary(result, "No calendar availability returned.");
  }

  const lines = [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    `Summary: ${entries.length} calendar${entries.length === 1 ? "" : "s"} in availability window`,
  ];

  const timeMin = asString(data.timeMin);
  const timeMax = asString(data.timeMax);
  if (timeMin && timeMax) {
    lines.push(`Window: ${timeMin} -> ${timeMax}`);
  }
  lines.push("");

  entries.forEach(([calendarId, calendar], index) => {
    const busy = asRecordArray(calendar.busy) ?? [];
    const free = asRecordArray(calendar.free) ?? [];
    const isReliable = asBoolean(calendar.is_reliable);

    lines.push(`${index + 1}. ${calendarId}`);
    lines.push(`   Busy slots: ${busy.length}`);
    lines.push(`   Free slots: ${free.length}`);
    lines.push(
      `   Reliable: ${
        isReliable === undefined ? "yes" : isReliable ? "yes" : "no"
      }`
    );

    const firstFree = asRecord(free[0]);
    if (firstFree) {
      lines.push(
        `   First free: ${asString(firstFree.start) ?? "unknown"} -> ${asString(firstFree.end) ?? "unknown"}`
      );
    }

    const firstBusy = asRecord(busy[0]);
    if (firstBusy) {
      lines.push(
        `   First busy: ${asString(firstBusy.start) ?? "unknown"} -> ${asString(firstBusy.end) ?? "unknown"}`
      );
    }
  });

  lines.push("");
  lines.push("Use --json for the full response.");
  lines.push("");
  return lines.join("\n");
}

function renderEmptySummary(result: ToolkitSummaryRenderInput, message: string): string {
  return [
    `${result.toolkit.displayName} / ${result.action.cliName}`,
    message,
    "",
    "Use --json for the full response.",
    "",
  ].join("\n");
}

function formatCalendarTime(value?: Record<string, unknown>): string {
  if (!value) {
    return "unknown";
  }
  return asString(value.dateTime) ?? asString(value.date) ?? "unknown";
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

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
