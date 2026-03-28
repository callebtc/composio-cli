import { describe, expect, it, vi } from "vitest";
import {
  ProxyComposioGateway,
  buildProxyToolkitAction,
  deriveProxyToolkitMetadata,
} from "../src/composio/proxy-gateway.js";
import type { ToolkitAction } from "../src/types.js";

describe("ProxyComposioGateway", () => {
  it("lists toolkit actions over the backend proxy and reuses the MCP session", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            'data: {"jsonrpc":"2.0","id":"1","result":{"protocolVersion":"2025-03-26","capabilities":{}}}',
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-1",
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            'data: {"jsonrpc":"2.0","id":"2","error":{"code":-32601,"message":"Method not found"}}',
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-1",
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            `data: ${JSON.stringify({
              jsonrpc: "2.0",
              id: "3",
              result: {
                tools: [
                  {
                    name: "GMAIL_LIST_LABELS",
                    description: "List Gmail labels.",
                    inputSchema: { type: "object", properties: {} },
                  },
                  {
                    name: "GMAIL_FETCH_EMAILS",
                    description: "Fetch Gmail messages.",
                    inputSchema: { type: "object", properties: { max_results: { type: "integer" } } },
                  },
                  {
                    name: "GOOGLECALENDAR_LIST_CALENDARS",
                    description: "List calendars.",
                    inputSchema: { type: "object", properties: {} },
                  },
                ],
              },
            })}`,
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-1",
            },
          }
        )
      );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
      clientVersion: "1.2.3",
    });

    const actions = await gateway.listToolkitActions("gmail", "GMAIL");
    const connections = await gateway.listConnectedAccounts({ statuses: ["ACTIVE"] });

    expect(actions.map(action => action.cliName)).toEqual(["fetch-emails", "list-labels"]);
    expect(actions.every(action => action.toolkitSlug === "gmail")).toBe(true);
    expect(connections).toEqual([
      {
        id: "proxy:gmail",
        status: "ACTIVE",
        toolkitSlug: "gmail",
        userId: "default",
        isDisabled: false,
      },
      {
        id: "proxy:googlecalendar",
        status: "ACTIVE",
        toolkitSlug: "googlecalendar",
        userId: "default",
        isDisabled: false,
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const initializeCall = fetchImpl.mock.calls[0];
    const initializeBody = JSON.parse(String(initializeCall?.[1]?.body)) as {
      method: string;
      params: { clientInfo: { version: string } };
    };
    expect(initializeBody.method).toBe("initialize");
    expect(initializeBody.params.clientInfo.version).toBe("1.2.3");

    const toolsCall = fetchImpl.mock.calls[2];
    expect((toolsCall?.[1]?.headers as Record<string, string>)["x-api-key"]).toBe(
      "cmpx_deadbeef.secret"
    );
    expect((toolsCall?.[1]?.headers as Record<string, string>)["mcp-session-id"]).toBe(
      "session-1"
    );
  });

  it("executes tool calls through the proxy and unwraps structured content", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            'data: {"jsonrpc":"2.0","id":"1","result":{"protocolVersion":"2025-03-26","capabilities":{}}}',
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-9",
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            'data: {"jsonrpc":"2.0","id":"2","error":{"code":-32601,"message":"Method not found"}}',
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-9",
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          [
            "event: message",
            'data: {"jsonrpc":"2.0","id":"3","result":{"structuredContent":{"labels":[{"id":"INBOX","name":"Inbox"}]}}}',
            "",
          ].join("\n"),
          {
            status: 200,
            headers: {
              "content-type": "text/event-stream",
              "mcp-session-id": "session-9",
            },
          }
        )
      );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
    });

    const action: ToolkitAction = {
      slug: "GMAIL_LIST_LABELS",
      name: "List Labels",
      description: "List Gmail labels.",
      toolkitSlug: "gmail",
      cliName: "list-labels",
      aliases: ["list-labels"],
      inputSchema: { type: "object", properties: {} },
    };

    const result = await gateway.executeAction(action, {
      userId: "default",
      input: {},
    });

    expect(result.successful).toBe(true);
    expect(result.data).toEqual({
      labels: [{ id: "INBOX", name: "Inbox" }],
    });

    const executionCall = fetchImpl.mock.calls[2];
    const executionBody = JSON.parse(String(executionCall?.[1]?.body)) as {
      method: string;
      params: {
        name: string;
        arguments: Record<string, unknown>;
      };
    };
    expect(executionBody.method).toBe("tools/call");
    expect(executionBody.params).toEqual({
      name: "GMAIL_LIST_LABELS",
      arguments: {},
    });
    expect((executionCall?.[1]?.headers as Record<string, string>)["mcp-session-id"]).toBe(
      "session-9"
    );
  });

  it("surfaces backend proxy errors from HTTP responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: "missing composio proxy token",
          },
        }),
        {
          status: 401,
          statusText: "Unauthorized",
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
    });

    await expect(gateway.listToolkitActions("gmail", "GMAIL")).rejects.toThrow(
      "401 Unauthorized: missing composio proxy token"
    );
  });

  it("surfaces JSON-RPC errors for non-notification calls returned over SSE", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        [
          "event: message",
          'data: {"jsonrpc":"2.0","id":"1","error":{"code":-32001,"message":"bad initialize"}}',
          "",
        ].join("\n"),
        {
          status: 200,
          headers: {
            "content-type": "text/event-stream",
          },
        }
      )
    );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
    });

    await expect(gateway.listToolkitActions("gmail", "GMAIL")).rejects.toThrow(
      "MCP initialize failed (-32001): bad initialize."
    );
  });
});

describe("proxy toolkit metadata", () => {
  it("derives supported and runtime toolkit slugs from MCP tool names", () => {
    expect(deriveProxyToolkitMetadata("GMAIL_LIST_LABELS")).toEqual({
      toolkitSlug: "gmail",
      toolPrefix: "GMAIL",
    });
    expect(deriveProxyToolkitMetadata("CUSTOM_WORKSPACE_CREATE_MESSAGE")).toEqual({
      toolkitSlug: "custom_workspace",
      toolPrefix: "CUSTOM_WORKSPACE",
    });
  });

  it("builds toolkit actions from MCP tools", () => {
    expect(
      buildProxyToolkitAction(
        {
          name: "GOOGLECALENDAR_LIST_CALENDARS",
          title: "List Calendars",
          description: "List accessible calendars.",
          inputSchema: { type: "object", properties: {} },
        },
        "googlecalendar",
        "GOOGLECALENDAR"
      )
    ).toMatchObject({
      slug: "GOOGLECALENDAR_LIST_CALENDARS",
      cliName: "list-calendars",
      toolkitSlug: "googlecalendar",
    });
  });
});
