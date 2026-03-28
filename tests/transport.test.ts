import { describe, expect, it } from "vitest";
import {
  isProxyToken,
  resolveDeploymentID,
  resolveGatewayConfig,
  resolveProxyURL,
} from "../src/composio/transport.js";

describe("gateway transport resolution", () => {
  it("keeps direct mode for regular Composio API keys", () => {
    expect(
      resolveGatewayConfig({
        apiKey: "cmp_direct_key",
        baseUrl: "https://backend.composio.dev",
      })
    ).toEqual({
      mode: "direct",
      apiKey: "cmp_direct_key",
      baseUrl: "https://backend.composio.dev",
    });
  });

  it("detects proxy tokens by prefix", () => {
    expect(isProxyToken("cmpx_deadbeef.secret")).toBe(true);
    expect(isProxyToken("cmp_live_123")).toBe(false);
  });

  it("prefers the explicit proxy URL from the environment", () => {
    expect(
      resolveGatewayConfig({
        apiKey: "cmpx_deadbeef.secret",
        env: {
          COMPOSIO_MCP_URL: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
          CLAWI_DEPLOYMENT_ID: "dep-1",
        },
      })
    ).toEqual({
      mode: "proxy",
      apiKey: "cmpx_deadbeef.secret",
      proxyUrl: "https://api.clawi.ai/api/deployments/dep-1/composio/mcp",
      deploymentID: "dep-1",
    });
  });

  it("builds the proxy URL from CLAWI_API_BASE and the deployment ID", () => {
    expect(
      resolveProxyURL(undefined, {
        CLAWI_API_BASE: "https://api.internal.clawi.ai/",
        CLAWI_DEPLOYMENT_ID: "dep-42",
      })
    ).toBe("https://api.internal.clawi.ai/api/deployments/dep-42/composio/mcp");
  });

  it("uses TENANT_ID as a deployment fallback", () => {
    expect(
      resolveDeploymentID({
        TENANT_ID: "dep-tenant",
      })
    ).toBe("dep-tenant");
  });

  it("treats an explicit proxy endpoint as final", () => {
    expect(
      resolveProxyURL(
        "https://api.clawi.ai/api/deployments/dep-9/composio/mcp",
        {
          CLAWI_DEPLOYMENT_ID: "ignored",
        }
      )
    ).toBe("https://api.clawi.ai/api/deployments/dep-9/composio/mcp");
  });

  it("builds a proxy endpoint from an explicit API base override", () => {
    expect(
      resolveProxyURL(
        "https://custom-api.clawi.ai/",
        {
          TENANT_ID: "dep-99",
        }
      )
    ).toBe("https://custom-api.clawi.ai/api/deployments/dep-99/composio/mcp");
  });

  it("requires deployment context when building a proxy URL", () => {
    expect(() =>
      resolveProxyURL(undefined, {
        CLAWI_API_BASE: "https://api.clawi.ai",
      })
    ).toThrow(
      "Composio proxy token requires COMPOSIO_MCP_URL or CLAWI_API_BASE plus CLAWI_DEPLOYMENT_ID/TENANT_ID."
    );
  });
});
