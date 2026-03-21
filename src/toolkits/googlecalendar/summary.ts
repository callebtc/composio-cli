import type { ToolkitAction } from "../../types.js";
import { buildReplayCommand, findInputProperty } from "../follow-up.js";
import { formatSummaryModeSuffix, resolveRequestedSummaryFields } from "../summary-fields.js";
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
    `Summary: ${calendars.length} calendar${calendars.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
    "",
  ];

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "calendar-id",
        aliases: ["id"],
        label: "Calendar ID",
        value: (calendar: Record<string, unknown>) =>
          asString(calendar.id) ?? asString(calendar.calendarId),
      },
      {
        key: "name",
        aliases: ["summary"],
        label: "Name",
        value: (calendar: Record<string, unknown>) =>
          asString(calendar.summaryOverride) ??
          asString(calendar.summary) ??
          asString(calendar.displayName),
      },
      {
        key: "access",
        aliases: ["access-role"],
        label: "Access",
        value: (calendar: Record<string, unknown>) => asString(calendar.accessRole),
      },
      {
        key: "time-zone",
        aliases: ["timezone", "timeZone"],
        label: "Time zone",
        value: (calendar: Record<string, unknown>) => asString(calendar.timeZone),
      },
      {
        key: "selected",
        label: "Selected",
        value: (calendar: Record<string, unknown>) => {
          const selected = asBoolean(calendar.selected);
          return selected === undefined ? "unknown" : selected ? "yes" : "no";
        },
      },
      {
        key: "primary",
        label: "Primary",
        value: (calendar: Record<string, unknown>) => {
          const primary = asBoolean(calendar.primary);
          return primary === undefined ? undefined : primary ? "yes" : "no";
        },
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${id}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(calendar) ?? "(empty)"}`);
      });
      return;
    }

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
  lines.push("Use --full for the standard text summary or --json for the full response.");
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
    `Summary: ${events.length} event${events.length === 1 ? "" : "s"}${formatSummaryModeSuffix(result.display)}`,
  ];

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
  const nextSyncToken = asString(data.nextSyncToken);
  if (nextSyncToken) {
    lines.push(`Next sync token: ${nextSyncToken}`);
    const syncTokenKey = findInputProperty(result.action.inputSchema, [
      "sync_token",
      "syncToken",
      "next_sync_token",
      "nextSyncToken",
    ]);
    if (syncTokenKey) {
      lines.push(
        `Sync later: ${buildReplayCommand(result, {
          [syncTokenKey]: nextSyncToken,
        })}`
      );
    }
  }
  lines.push("");

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "event-id",
        aliases: ["id"],
        label: "Event ID",
        value: (event: Record<string, unknown>) => asString(event.id),
      },
      {
        key: "summary",
        aliases: ["title"],
        label: "Summary",
        value: (event: Record<string, unknown>) => asString(event.summary),
      },
      {
        key: "status",
        label: "Status",
        value: (event: Record<string, unknown>) => asString(event.status),
      },
      {
        key: "start",
        label: "Start",
        value: (event: Record<string, unknown>) => formatCalendarTime(asRecord(event.start)),
      },
      {
        key: "end",
        label: "End",
        value: (event: Record<string, unknown>) => formatCalendarTime(asRecord(event.end)),
      },
      {
        key: "organizer",
        label: "Organizer",
        value: (event: Record<string, unknown>) =>
          asString(asRecord(event.organizer)?.email) ??
          asString(asRecord(event.creator)?.email),
      },
      {
        key: "attendees",
        label: "Attendees",
        value: (event: Record<string, unknown>) => {
          const count = asRecordArray(event.attendees)?.length;
          return count !== undefined ? String(count) : undefined;
        },
      },
      {
        key: "location",
        label: "Location",
        value: (event: Record<string, unknown>) => asString(event.location),
      },
    ],
    result.display.fields
  );

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

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${id}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value(event) ?? "(empty)"}`);
      });
      return;
    }

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
  lines.push("Use --full for the standard text summary or --json for the full response.");
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
    `Summary: ${entries.length} calendar${entries.length === 1 ? "" : "s"} in availability window${formatSummaryModeSuffix(result.display)}`,
  ];

  const timeMin = asString(data.timeMin);
  const timeMax = asString(data.timeMax);
  if (timeMin && timeMax) {
    lines.push(`Window: ${timeMin} -> ${timeMax}`);
  }
  lines.push("");

  const requestedFields = resolveRequestedSummaryFields(
    [
      {
        key: "calendar-id",
        aliases: ["id", "calendar"],
        label: "Calendar",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) => entry.calendarId,
      },
      {
        key: "busy-slots",
        aliases: ["busy"],
        label: "Busy slots",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) =>
          String(asRecordArray(entry.calendar.busy)?.length ?? 0),
      },
      {
        key: "free-slots",
        aliases: ["free"],
        label: "Free slots",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) =>
          String(asRecordArray(entry.calendar.free)?.length ?? 0),
      },
      {
        key: "reliable",
        label: "Reliable",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) => {
          const isReliable = asBoolean(entry.calendar.is_reliable);
          return isReliable === undefined ? "yes" : isReliable ? "yes" : "no";
        },
      },
      {
        key: "first-free",
        label: "First free",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) => {
          const firstFree = asRecord((asRecordArray(entry.calendar.free) ?? [])[0]);
          return firstFree
            ? `${asString(firstFree.start) ?? "unknown"} -> ${asString(firstFree.end) ?? "unknown"}`
            : undefined;
        },
      },
      {
        key: "first-busy",
        label: "First busy",
        value: (entry: { calendarId: string; calendar: Record<string, unknown> }) => {
          const firstBusy = asRecord((asRecordArray(entry.calendar.busy) ?? [])[0]);
          return firstBusy
            ? `${asString(firstBusy.start) ?? "unknown"} -> ${asString(firstBusy.end) ?? "unknown"}`
            : undefined;
        },
      },
    ],
    result.display.fields
  );

  entries.forEach(([calendarId, calendar], index) => {
    const busy = asRecordArray(calendar.busy) ?? [];
    const free = asRecordArray(calendar.free) ?? [];
    const isReliable = asBoolean(calendar.is_reliable);

    if (result.display.idsOnly) {
      lines.push(`${index + 1}. ${calendarId}`);
      return;
    }

    if (requestedFields) {
      lines.push(`${index + 1}.`);
      requestedFields.forEach(field => {
        lines.push(`   ${field.label}: ${field.value({ calendarId, calendar }) ?? "(empty)"}`);
      });
      return;
    }

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
