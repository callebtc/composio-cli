import { describe, expect, it } from "vitest";
import { runCli } from "../src/run-cli.js";
import type { ComposioGateway, ToolkitAction } from "../src/types.js";

const gmailActions: ToolkitAction[] = [
  {
    slug: "GMAIL_FETCH_EMAILS",
    name: "Fetch Emails",
    description: "Fetch messages from Gmail.",
    toolkitSlug: "gmail",
    cliName: "fetch-emails",
    aliases: ["fetch-emails", "gmail-fetch-emails"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      required: ["max_results"],
      properties: {
        max_results: {
          type: "integer",
          description: "Maximum number of messages to return.",
        },
        unread: {
          type: "boolean",
          description: "Filter to unread messages only.",
        },
        label: {
          type: "string",
          description: "Optional Gmail label.",
        },
        filters: {
          type: "object",
          description: "Structured filters.",
        },
        query: {
          type: "string",
          description: "Free-form Gmail search query.",
        },
        include_spam_trash: {
          type: "boolean",
          description: "Include spam and trash folders.",
        },
        page_token: {
          type: "string",
          description: "Pagination token returned from a previous call.",
        },
      },
    },
  },
  {
    slug: "GMAIL_LIST_LABELS",
    name: "List Labels",
    description: "List Gmail labels.",
    toolkitSlug: "gmail",
    cliName: "list-labels",
    aliases: ["list-labels", "gmail-list-labels"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    slug: "GMAIL_SEARCH_EMAILS",
    name: "Search Emails",
    description: "Search Gmail messages.",
    toolkitSlug: "gmail",
    cliName: "search-emails",
    aliases: ["search-emails", "gmail-search-emails"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query.",
        },
      },
    },
  },
  {
    slug: "GMAIL_CREATE_EMAIL_DRAFT",
    name: "Create Email Draft",
    description: "Create a Gmail draft.",
    toolkitSlug: "gmail",
    cliName: "create-email-draft",
    aliases: ["create-email-draft", "gmail-create-email-draft"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        recipient: {
          type: "string",
          description: "Recipient email address.",
        },
      },
    },
  },
  {
    slug: "GMAIL_SEND_EMAIL",
    name: "Send Email",
    description: "Send an email through Gmail.",
    toolkitSlug: "gmail",
    cliName: "send-email",
    aliases: ["send-email", "gmail-send-email"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      required: ["recipient", "subject", "body"],
      properties: {
        recipient: {
          type: "string",
          description: "Recipient email address.",
        },
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        body: {
          type: "string",
          description: "Email body.",
        },
      },
    },
  },
];

const googleCalendarActions: ToolkitAction[] = [
  {
    slug: "GOOGLECALENDAR_LIST_CALENDARS",
    name: "List Calendars",
    description: "List accessible calendars.",
    toolkitSlug: "googlecalendar",
    cliName: "list-calendars",
    aliases: ["list-calendars", "googlecalendar-list-calendars"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        max_results: {
          type: "integer",
          description: "Maximum number of calendars to return.",
        },
      },
    },
  },
  {
    slug: "GOOGLECALENDAR_EVENTS_LIST",
    name: "Events List",
    description: "List events from a calendar.",
    toolkitSlug: "googlecalendar",
    cliName: "events-list",
    aliases: ["events-list", "googlecalendar-events-list"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        calendar_id: {
          type: "string",
          description: "Calendar identifier.",
        },
        max_results: {
          type: "integer",
          description: "Maximum number of events to return.",
        },
        page_token: {
          type: "string",
          description: "Pagination token returned from a previous call.",
        },
        sync_token: {
          type: "string",
          description: "Sync token returned from a previous call.",
        },
      },
    },
  },
  {
    slug: "GOOGLECALENDAR_EVENTS_GET",
    name: "Events Get",
    description: "Get one event by ID.",
    toolkitSlug: "googlecalendar",
    cliName: "events-get",
    aliases: ["events-get", "googlecalendar-events-get"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "Event identifier.",
        },
      },
    },
  },
  {
    slug: "GOOGLECALENDAR_CREATE_EVENT",
    name: "Create Event",
    description: "Create a new calendar event.",
    toolkitSlug: "googlecalendar",
    cliName: "create-event",
    aliases: ["create-event", "googlecalendar-create-event"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        calendar_id: {
          type: "string",
          description: "Calendar identifier.",
        },
      },
    },
  },
  {
    slug: "GOOGLECALENDAR_FIND_FREE_SLOTS",
    name: "Find Free Slots",
    description: "Find free slots for one or more calendars.",
    toolkitSlug: "googlecalendar",
    cliName: "find-free-slots",
    aliases: ["find-free-slots", "googlecalendar-find-free-slots"],
    version: "20260101_00",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Calendars to query.",
        },
      },
    },
  },
];

describe("runCli", () => {
  it("renders the root guide by default", async () => {
    const result = await runCli([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("agent-first CLI for Composio toolkits");
    expect(result.stdout).toContain("Authenticate first");
    expect(result.stderr).toBe("");
  });

  it("renders only enabled toolkit commands in root help when authenticated", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Enabled toolkits for user 'default'");
    expect(result.stdout).toContain("gmail");
    expect(result.stdout).not.toContain("github");
  });

  it("requires an API key before exposing toolkit help", async () => {
    const result = await runCli(["gmail"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Missing Composio API key");
  });

  it("prioritizes featured actions in toolkit help", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["gmail", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Recommended first actions:");
    expect(result.stdout).toContain("fetch-emails: Read recent inbox messages with compact summaries.");
    expect(result.stdout).toContain("search-emails: Search Gmail by query before reading full messages.");
    expect(result.stdout).toContain("create-email-draft: Prepare an email draft without sending it yet.");
    expect(result.stdout).toContain("Other discovered actions");
    expect(result.stdout).toContain("list-labels");
    expect(result.stdout.indexOf("Recommended first actions:")).toBeLessThan(
      result.stdout.indexOf("Other discovered actions")
    );
  });

  it("lists actions from the gateway", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["gmail", "actions", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Gmail actions");
    expect(result.stdout).toContain("Recommended first actions:");
    expect(result.stdout).toContain("fetch-emails: Read recent inbox messages with compact summaries.");
    expect(result.stdout).toContain("send-email: Send an email when the content is ready.");
    expect(result.stdout).toContain("list-labels");
    expect(result.stdout.indexOf("fetch-emails")).toBeLessThan(result.stdout.indexOf("list-labels"));
  });

  it("renders action help for toolkit action --help", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["gmail", "fetch-emails", "--help", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Gmail / fetch-emails");
    expect(result.stdout).toContain("Default text output is summarized for this Gmail action");
    expect(result.stdout).toContain("Required top-level fields: max_results");
    expect(result.stdout).toContain("Optional input fields hidden");
    expect(result.stdout).not.toContain("Slug:");
    expect(result.stdout).not.toContain("Pinned version:");
  });

  it("shows every optional parameter when --all-parameters is requested", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(
      ["gmail", "fetch-emails", "--help", "--all-parameters", "--api-key", "test-key"],
      {
        gatewayFactory: gateway.factory,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--query");
    expect(result.stdout).toContain("--include-spam-trash");
    expect(result.stdout).toContain("--page-token");
    expect(result.stdout).not.toContain("Optional input fields hidden");
  });

  it("renders Google Calendar action help with summary guidance", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
    });

    const result = await runCli(
      ["google-calendar", "events-list", "--help", "--api-key", "test-key"],
      {
        gatewayFactory: gateway.factory,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Google Calendar / events-list");
    expect(result.stdout).toContain("Default text output is summarized for this Google Calendar action");
  });

  it("prioritizes featured Google Calendar actions in the full action list", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
    });

    const result = await runCli(["google-calendar", "actions", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Recommended first actions:");
    expect(result.stdout).toContain("events-list: List upcoming events from one calendar.");
    expect(result.stdout).toContain("events-get: Read one event by its event ID.");
    expect(result.stdout).toContain("create-event: Create a calendar event with time, title, and attendees.");
    expect(result.stdout.indexOf("events-list")).toBeLessThan(result.stdout.indexOf("find-free-slots"));
    expect(result.stdout.indexOf("find-free-slots")).toBeLessThan(result.stdout.indexOf("list-calendars"));
  });

  it("summarizes Gmail fetch-emails output by default", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
      executeResult: () => ({
        successful: true,
        data: {
          resultSizeEstimate: 42,
          nextPageToken: "next_page_1",
          messages: [
            {
              messageId: "msg_1",
              sender: "Alice <alice@example.com>",
              subject: "Quarterly update",
              messageTimestamp: "2026-03-21T09:15:00Z",
              labelIds: ["INBOX", "IMPORTANT"],
              preview: {
                body: "Hello team, here is the quarterly update with a long body that should be truncated once it reaches the preview limit for the default CLI output.",
              },
              messageText: "full body should not be dumped in text mode",
            },
          ],
        },
        logId: "log_123",
      }),
    });

    const result = await runCli(
      ["gmail", "fetch-emails", "--api-key", "test-key", "--max-results", "1"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Gmail / fetch-emails");
    expect(result.stdout).toContain("Summary: 1 message");
    expect(result.stdout).toContain("msg_1");
    expect(result.stdout).toContain("From: Alice <alice@example.com>");
    expect(result.stdout).toContain("Subject: Quarterly update");
    expect(result.stdout).toContain("Labels: INBOX, IMPORTANT");
    expect(result.stdout).toContain(
      `Next page: composio-cli gmail fetch-emails --input '{"max_results":1,"page_token":"next_page_1"}' --api-key <key>`
    );
    expect(result.stdout).toContain("Use --full for the standard text summary or --json for the full response.");
    expect(result.stdout).toContain("fetch-message-by-message-id --message-id msg_1");
    expect(result.stdout).not.toContain("\"messageText\"");
    expect(result.stdout).not.toContain("full body should not be dumped");
  });

  it("renders concise empty Gmail summaries", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
      executeResult: () => ({
        successful: true,
        data: {
          messages: [],
        },
        logId: "log_123",
      }),
    });

    const result = await runCli(
      ["gmail", "fetch-emails", "--api-key", "test-key", "--max-results", "1"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No messages found.");
    expect(result.stdout).toContain("Use --full for the standard text summary or --json for the full response.");
    expect(result.stdout).not.toContain("Data:");
  });

  it("summarizes Google Calendar list-calendars output by default", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
      executeResult: () => ({
        successful: true,
        data: {
          calendars: [
            {
              id: "primary",
              summary: "Primary Calendar",
              accessRole: "owner",
              primary: true,
              selected: true,
              timeZone: "Europe/Berlin",
            },
          ],
        },
      }),
    });

    const result = await runCli(["google-calendar", "list-calendars", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
      stdoutIsTTY: false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Google Calendar / list-calendars");
    expect(result.stdout).toContain("Summary: 1 calendar");
    expect(result.stdout).toContain("Primary Calendar");
    expect(result.stdout).toContain("Calendar ID: primary");
    expect(result.stdout).toContain("Access: owner");
    expect(result.stdout).toContain("Time zone: Europe/Berlin");
    expect(result.stdout).toContain("Use --full for the standard text summary or --json for the full response.");
    expect(result.stdout).not.toContain("Data:");
  });

  it("summarizes Google Calendar event lists by default", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
      executeResult: () => ({
        successful: true,
        data: {
          nextPageToken: "page_2",
          nextSyncToken: "sync_2",
          items: [
            {
              id: "evt_1",
              summary: "Design review",
              status: "confirmed",
              start: { dateTime: "2026-03-21T09:00:00Z" },
              end: { dateTime: "2026-03-21T10:00:00Z" },
              organizer: { email: "owner@example.com" },
              attendees: [{ email: "a@example.com" }, { email: "b@example.com" }],
              location: "Room 4",
            },
          ],
        },
      }),
    });

    const result = await runCli(
      ["google-calendar", "events-list", "--api-key", "test-key", "--calendar-id", "primary"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Google Calendar / events-list");
    expect(result.stdout).toContain("Summary: 1 event");
    expect(result.stdout).toContain("Design review");
    expect(result.stdout).toContain("Event ID: evt_1");
    expect(result.stdout).toContain("Start: 2026-03-21T09:00:00Z");
    expect(result.stdout).toContain("End: 2026-03-21T10:00:00Z");
    expect(result.stdout).toContain("Organizer: owner@example.com");
    expect(result.stdout).toContain("Attendees: 2");
    expect(result.stdout).toContain("Location: Room 4");
    expect(result.stdout).toContain("Next page token: page_2");
    expect(result.stdout).toContain(
      `Next page: composio-cli google-calendar events-list --input '{"calendar_id":"primary","page_token":"page_2"}' --api-key <key>`
    );
    expect(result.stdout).toContain("Next sync token: sync_2");
    expect(result.stdout).toContain(
      `Sync later: composio-cli google-calendar events-list --input '{"calendar_id":"primary","sync_token":"sync_2"}' --api-key <key>`
    );
    expect(result.stdout).not.toContain("Data:");
  });

  it("summarizes Google Calendar free-slot output by default", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
      executeResult: () => ({
        successful: true,
        data: {
          timeMin: "2026-03-21T00:00:00Z",
          timeMax: "2026-03-22T00:00:00Z",
          calendars: {
            primary: {
              busy: [{ start: "2026-03-21T14:00:00Z", end: "2026-03-21T14:30:00Z" }],
              free: [{ start: "2026-03-21T00:00:00Z", end: "2026-03-21T14:00:00Z" }],
              is_reliable: true,
            },
          },
        },
      }),
    });

    const result = await runCli(
      ["google-calendar", "find-free-slots", "--api-key", "test-key", "--items", '["primary"]'],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Google Calendar / find-free-slots");
    expect(result.stdout).toContain("Summary: 1 calendar in availability window");
    expect(result.stdout).toContain("Window: 2026-03-21T00:00:00Z -> 2026-03-22T00:00:00Z");
    expect(result.stdout).toContain("primary");
    expect(result.stdout).toContain("Busy slots: 1");
    expect(result.stdout).toContain("Free slots: 1");
    expect(result.stdout).toContain("Reliable: yes");
    expect(result.stdout).toContain("First free: 2026-03-21T00:00:00Z -> 2026-03-21T14:00:00Z");
    expect(result.stdout).toContain("First busy: 2026-03-21T14:00:00Z -> 2026-03-21T14:30:00Z");
    expect(result.stdout).not.toContain("Data:");
  });

  it("supports canonical action aliases like list-events", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
      executeResult: () => ({
        successful: true,
        data: {
          items: [
            {
              id: "evt_1",
              summary: "Design review",
              start: { dateTime: "2026-03-21T09:00:00Z" },
              end: { dateTime: "2026-03-21T10:00:00Z" },
            },
          ],
        },
      }),
    });

    const result = await runCli(
      ["google-calendar", "list-events", "--api-key", "test-key", "--calendar-id", "primary"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Google Calendar / events-list");
    expect(result.stdout).toContain("Design review");
  });

  it("auto-corrects close action typos in text mode", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        googlecalendar: googleCalendarActions,
      },
      connections: [
        { id: "conn_1", toolkitSlug: "googlecalendar", status: "ACTIVE", userId: "default" },
      ],
    });

    const result = await runCli(
      ["google-calendar", "evnts-list", "--help", "--api-key", "test-key"],
      {
        gatewayFactory: gateway.factory,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Auto-corrected action 'evnts-list' to 'events-list'.");
    expect(result.stdout).toContain("Google Calendar / events-list");
  });

  it("executes an action and merges JSON, flags, booleans, and --set", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(
      [
        "gmail",
        "fetch-emails",
        "--api-key",
        "test-key",
        "--json",
        "--input",
        '{"label":"INBOX"}',
        "--max-results",
        "5",
        "--unread",
        "--set",
        "filters.query=from:billing",
      ],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      input: Record<string, unknown>;
      version?: string;
      toolSlug: string;
    };
    expect(payload.toolSlug).toBe("GMAIL_FETCH_EMAILS");
    expect(payload.version).toBe("20260101_00");
    expect(payload.input).toEqual({
      label: "INBOX",
      max_results: 5,
      unread: true,
      filters: {
        query: "from:billing",
      },
    });
    expect(gateway.executions).toHaveLength(1);
  });

  it("returns structured validation errors in JSON mode", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["gmail", "fetch-emails", "--api-key", "test-key", "--json"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout) as {
      successful: boolean;
      error: {
        kind: string;
        message: string;
      };
      toolkit?: string;
      action?: string;
    };
    expect(payload.successful).toBe(false);
    expect(payload.error.kind).toBe("validation");
    expect(payload.error.message).toContain("Missing required fields: max_results");
    expect(payload.toolkit).toBe("gmail");
    expect(payload.action).toBe("fetch-emails");
  });

  it("projects Gmail summaries to ids only", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
      executeResult: () => ({
        successful: true,
        data: {
          messages: [
            {
              messageId: "msg_1",
              sender: "Alice <alice@example.com>",
              subject: "Quarterly update",
            },
          ],
        },
      }),
    });

    const result = await runCli(
      ["gmail", "fetch-emails", "--api-key", "test-key", "--max-results", "1", "--ids-only"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Summary: 1 message (ids only)");
    expect(result.stdout).toContain("1. msg_1");
    expect(result.stdout).not.toContain("From:");
    expect(result.stdout).not.toContain("Subject:");
  });

  it("projects Gmail summaries to selected fields", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
      executeResult: () => ({
        successful: true,
        data: {
          messages: [
            {
              messageId: "msg_1",
              sender: "Alice <alice@example.com>",
              subject: "Quarterly update",
              messageTimestamp: "2026-03-21T09:15:00Z",
            },
          ],
        },
      }),
    });

    const result = await runCli(
      [
        "gmail",
        "fetch-emails",
        "--api-key",
        "test-key",
        "--max-results",
        "1",
        "--fields",
        "subject,date",
      ],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Summary: 1 message (fields: subject, date)");
    expect(result.stdout).toContain("Subject: Quarterly update");
    expect(result.stdout).toContain("Date: 2026-03-21T09:15:00Z");
    expect(result.stdout).not.toContain("From:");
    expect(result.stdout).not.toContain("Labels:");
  });

  it("bypasses summaries when --full is requested", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
      executeResult: () => ({
        successful: true,
        data: {
          messages: [
            {
              messageId: "msg_1",
              messageText: "full body",
            },
          ],
        },
      }),
    });

    const result = await runCli(
      ["gmail", "fetch-emails", "--api-key", "test-key", "--max-results", "1", "--full"],
      {
        gatewayFactory: gateway.factory,
        stdoutIsTTY: false,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Data:");
    expect(result.stdout).toContain("\"messageText\": \"full body\"");
    expect(result.stdout).not.toContain("Summary:");
  });

  it("rejects projection flags for actions without summary support", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(
      [
        "gmail",
        "send-email",
        "--api-key",
        "test-key",
        "--fields",
        "subject",
        "--recipient",
        "a@example.com",
        "--subject",
        "Hi",
        "--body",
        "Hello",
      ],
      {
        gatewayFactory: gateway.factory,
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not support --fields or --ids-only");
  });

  it("renders connections at the top level", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "agent-1" }],
    });

    const result = await runCli(["connections", "--api-key", "test-key", "--user", "agent-1"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Connections for user 'agent-1'");
    expect(result.stdout).toContain("gmail");
    expect(result.stdout).toContain("connected");
    expect(result.stdout).not.toContain("conn_1");
  });

  it("hides disabled toolkits even if they exist in the static registry", async () => {
    const gateway = createFakeGateway({
      actionsByToolkit: {
        gmail: gmailActions,
      },
      connections: [{ id: "conn_1", toolkitSlug: "gmail", status: "ACTIVE", userId: "default" }],
    });

    const result = await runCli(["github", "--api-key", "test-key"], {
      gatewayFactory: gateway.factory,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Toolkit 'github' is disabled");
    expect(result.stderr).toContain("gmail");
  });
});

function createFakeGateway(options: {
  actionsByToolkit: Record<string, ToolkitAction[]>;
  connections?: Array<{ id: string; toolkitSlug: string; status?: string; userId?: string }>;
  executeResult?: (action: ToolkitAction) => {
    successful: boolean;
    data: unknown;
    error?: string | null | undefined;
    logId?: string | undefined;
    version?: string | undefined;
  };
}): {
  executions: Array<{
    action: ToolkitAction;
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string | undefined;
    };
  }>;
  factory: () => ComposioGateway;
} {
  const executions: Array<{
    action: ToolkitAction;
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string | undefined;
    };
  }> = [];

  const gateway: ComposioGateway = {
    listToolkitActions: async toolkitSlug => options.actionsByToolkit[toolkitSlug] ?? [],
    listConnectedAccounts: async request =>
      (options.connections ?? []).filter(connection => {
        if (request?.toolkitSlugs && !request.toolkitSlugs.includes(connection.toolkitSlug)) {
          return false;
        }
        if (request?.userId && connection.userId !== request.userId) {
          return false;
        }
        if (request?.statuses && connection.status && !request.statuses.includes(connection.status)) {
          return false;
        }
        return true;
      }),
    executeAction: async (action, executionOptions) => {
      executions.push({ action, options: executionOptions });
      const execution = options.executeResult?.(action);
      return {
        successful: execution?.successful ?? true,
        data:
          execution?.data ?? {
            echoed: true,
          },
        error: execution?.error,
        logId: execution?.logId ?? "log_123",
        toolSlug: action.slug,
        toolkitSlug: action.toolkitSlug,
        version: execution?.version ?? executionOptions.toolVersion ?? action.version,
        userId: executionOptions.userId,
        input: executionOptions.input,
      };
    },
  };

  return {
    executions,
    factory: () => gateway,
  };
}
