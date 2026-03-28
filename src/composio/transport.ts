import {
  CLAWI_API_BASE_ENV,
  CLAWI_DEPLOYMENT_ID_ENV,
  COMPOSIO_MCP_URL_ENV,
  COMPOSIO_PROXY_TOKEN_PREFIX,
  DEFAULT_CLAWI_API_BASE,
  TENANT_ID_ENV,
} from "../constants.js";
import type { EnvMap, GatewayFactoryOptions } from "../types.js";

export type ResolvedGatewayConfig =
  | {
      mode: "direct";
      apiKey: string;
      baseUrl?: string;
    }
  | {
      mode: "proxy";
      apiKey: string;
      proxyUrl: string;
      deploymentID?: string;
    };

export function resolveGatewayConfig(options: GatewayFactoryOptions): ResolvedGatewayConfig {
  const apiKey = options.apiKey.trim();
  if (!isProxyToken(apiKey)) {
    return {
      mode: "direct",
      apiKey,
      ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    };
  }

  const env = options.env ?? process.env;
  const deploymentID = resolveDeploymentID(env);

  return {
    mode: "proxy",
    apiKey,
    proxyUrl: resolveProxyURL(options.baseUrl, env, deploymentID),
    ...(deploymentID ? { deploymentID } : {}),
  };
}

export function isProxyToken(apiKey: string): boolean {
  return apiKey.trim().startsWith(COMPOSIO_PROXY_TOKEN_PREFIX);
}

export function resolveDeploymentID(env: EnvMap): string | undefined {
  return firstNonEmpty(env[CLAWI_DEPLOYMENT_ID_ENV], env[TENANT_ID_ENV]);
}

export function resolveProxyURL(
  baseUrl: string | undefined,
  env: EnvMap,
  deploymentID = resolveDeploymentID(env)
): string {
  const explicitBase = baseUrl?.trim();
  if (explicitBase) {
    if (isProxyEndpointURL(explicitBase)) {
      return explicitBase;
    }
    return buildProxyURL(explicitBase, deploymentID);
  }

  const explicitProxyURL = firstNonEmpty(env[COMPOSIO_MCP_URL_ENV]);
  if (explicitProxyURL) {
    return explicitProxyURL;
  }

  return buildProxyURL(firstNonEmpty(env[CLAWI_API_BASE_ENV]) ?? DEFAULT_CLAWI_API_BASE, deploymentID);
}

function buildProxyURL(apiBase: string, deploymentID: string | undefined): string {
  if (!deploymentID) {
    throw new Error(
      "Composio proxy token requires COMPOSIO_MCP_URL or CLAWI_API_BASE plus CLAWI_DEPLOYMENT_ID/TENANT_ID."
    );
  }

  return `${apiBase.replace(/\/+$/, "")}/api/deployments/${encodeURIComponent(deploymentID)}/composio/mcp`;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

function isProxyEndpointURL(value: string): boolean {
  return /\/api\/deployments\/[^/]+\/composio\/mcp\/?$/i.test(value);
}
