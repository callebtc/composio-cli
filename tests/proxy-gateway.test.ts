import { describe, expect, it, vi } from "vitest";
import { ProxyComposioGateway } from "../src/composio/proxy-gateway.js";
import type { ToolkitAction } from "../src/types.js";

describe("ProxyComposioGateway", () => {
  it("lists connected accounts and toolkit actions through backend discovery endpoints", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "user-123",
            items: [
              {
                id: "ca-1",
                status: "ACTIVE",
                user_id: "user-123",
                is_disabled: false,
                toolkit: { slug: "gmail" },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                slug: "GMAIL_LIST_LABELS",
                name: "List Labels",
                description: "List Gmail labels.",
                version: "00000000_00",
                input_parameters: { type: "object", properties: {} },
                output_parameters: { type: "object", properties: {} },
                toolkit: { slug: "gmail", name: "gmail" },
              },
              {
                slug: "GMAIL_FETCH_EMAILS",
                name: "Fetch Emails",
                description: "Fetch Gmail messages.",
                version: "00000000_00",
                input_parameters: { type: "object", properties: { max_results: { type: "integer" } } },
                output_parameters: { type: "object", properties: {} },
                toolkit: { slug: "gmail", name: "gmail" },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
    });

    const connections = await gateway.listConnectedAccounts({ statuses: ["ACTIVE"] });
    const actions = await gateway.listToolkitActions("gmail", "GMAIL");
    const userId = await gateway.getDefaultUserId();

    expect(connections).toEqual([
      {
        id: "ca-1",
        status: "ACTIVE",
        toolkitSlug: "gmail",
        userId: "user-123",
        isDisabled: false,
      },
    ]);
    expect(actions.map(action => action.cliName)).toEqual(["fetch-emails", "list-labels"]);
    expect(actions.every(action => action.toolkitSlug === "gmail")).toBe(true);
    expect(userId).toBe("user-123");

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.clawi.ai/api/deployments/dep-1/composio/connected-accounts?statuses=ACTIVE",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.clawi.ai/api/deployments/dep-1/composio/toolkits/gmail/tools?limit=9999",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    expect((fetchImpl.mock.calls[0]?.[1]?.headers as Headers).get("x-api-key")).toBe(
      "cmpx_deadbeef.secret"
    );
  });

  it("executes tool calls through backend execution endpoints", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          successful: true,
          data: { labels: [{ id: "INBOX", name: "Inbox" }] },
          error: null,
          log_id: "log-1",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
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
      toolkitName: "gmail",
      version: "00000000_00",
      cliName: "list-labels",
      aliases: ["list-labels"],
      inputSchema: { type: "object", properties: {} },
    };

    const result = await gateway.executeAction(action, {
      userId: "user-123",
      input: {},
    });

    expect(result).toMatchObject({
      successful: true,
      data: { labels: [{ id: "INBOX", name: "Inbox" }] },
      logId: "log-1",
      toolSlug: "GMAIL_LIST_LABELS",
      toolkitSlug: "gmail",
      userId: "user-123",
    });

    const request = fetchImpl.mock.calls[0];
    expect(request?.[0]).toBe(
      "https://api.clawi.ai/api/deployments/dep-1/composio/tools/GMAIL_LIST_LABELS/execute"
    );
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      user_id: "user-123",
      arguments: {},
      version: "00000000_00",
    });
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
          headers: { "content-type": "application/json" },
        }
      )
    );

    const gateway = new ProxyComposioGateway({
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      fetchImpl,
    });

    await expect(gateway.listConnectedAccounts({ statuses: ["ACTIVE"] })).rejects.toThrow(
      "401 Unauthorized: missing composio proxy token"
    );
  });
});
