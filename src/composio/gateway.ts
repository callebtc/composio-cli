import { createDirectComposioGateway } from "./direct-gateway.js";
import { createProxyComposioGateway } from "./proxy-gateway.js";
import { resolveGatewayConfig } from "./transport.js";
import type { ComposioGateway, GatewayFactoryOptions } from "../types.js";

export function createComposioGateway(options: GatewayFactoryOptions): ComposioGateway {
  const resolved = resolveGatewayConfig(options);
  if (resolved.mode === "proxy") {
    return createProxyComposioGateway({
      apiKey: resolved.apiKey,
      proxyUrl: resolved.proxyUrl,
    });
  }
  return createDirectComposioGateway({
    apiKey: resolved.apiKey,
    ...(resolved.baseUrl ? { baseUrl: resolved.baseUrl } : {}),
  });
}
