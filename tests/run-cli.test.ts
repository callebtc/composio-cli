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
    expect(result.stdout).toContain("fetch-emails");
    expect(result.stdout).toContain("list-labels");
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
    expect(result.stdout).toContain("Use --json for the full response.");
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
    expect(result.stdout).toContain("Use --json for the full response.");
    expect(result.stdout).not.toContain("Data:");
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
