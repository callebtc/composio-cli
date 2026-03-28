import { classifyCliError } from "../errors.js";
import { buildToolkitAction } from "../toolkits/actions.js";
import type {
  ComposioGateway,
  ConnectedAccountSummary,
  ExecuteActionResult,
  JsonSchemaObject,
  ToolkitAction,
} from "../types.js";

interface ProxyGatewayOptions {
  apiKey: string;
  proxyUrl: string;
  fetchImpl?: typeof fetch;
}

interface ProxyConnectedAccountsPayload {
  user_id?: string;
  items?: Array<{
    id?: string;
    status?: string;
    user_id?: string;
    is_disabled?: boolean;
    toolkit?: {
      slug?: string;
    };
  }>;
}

interface ProxyToolListPayload {
  items?: Array<{
    slug?: string;
    name?: string;
    description?: string;
    version?: string;
    is_deprecated?: boolean;
    input_parameters?: JsonSchemaObject;
    output_parameters?: JsonSchemaObject;
    toolkit?: {
      slug?: string;
      name?: string;
    };
  }>;
}

interface ProxyExecuteToolPayload {
  successful?: boolean;
  data?: unknown;
  error?: string | null;
  log_id?: string;
}

export function createProxyComposioGateway(options: ProxyGatewayOptions): ComposioGateway {
  return new ProxyComposioGateway(options);
}

export class ProxyComposioGateway implements ComposioGateway {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly proxyBaseUrl: string;
  private readonly actionCache = new Map<string, Promise<ToolkitAction[]>>();
  private defaultUserIdPromise?: Promise<string | undefined>;

  constructor(options: ProxyGatewayOptions) {
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.proxyBaseUrl = deriveProxyBaseUrl(options.proxyUrl);
  }

  async listToolkitActions(toolkitSlug: string, toolPrefix: string): Promise<ToolkitAction[]> {
    const cacheKey = `${toolkitSlug}:${toolPrefix}`;
    const existing = this.actionCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = this.fetchToolkitActions(toolkitSlug, toolPrefix);
    this.actionCache.set(cacheKey, promise);
    return promise;
  }

  async listConnectedAccounts(options: {
    toolkitSlugs?: string[];
    userId?: string;
    statuses?: string[];
  } = {}): Promise<ConnectedAccountSummary[]> {
    const payload = await this.fetchConnectedAccounts(options);
    return (payload.items ?? [])
      .filter(item => typeof item.id === "string" && typeof item.toolkit?.slug === "string")
      .map(item => ({
        id: item.id!,
        status: item.status,
        toolkitSlug: item.toolkit!.slug!,
        userId: item.user_id ?? normalizeUserId(payload.user_id),
        isDisabled: item.is_disabled,
      }));
  }

  async getDefaultUserId(): Promise<string | undefined> {
    if (!this.defaultUserIdPromise) {
      this.defaultUserIdPromise = this.fetchDefaultUserId();
    }
    return this.defaultUserIdPromise;
  }

  async executeAction(
    action: ToolkitAction,
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string | undefined;
    }
  ): Promise<ExecuteActionResult> {
    const payload = await this.requestJSON<ProxyExecuteToolPayload>(
      `/tools/${encodeURIComponent(action.slug)}/execute`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: options.userId,
          arguments: options.input,
          ...(options.toolVersion ?? action.version
            ? { version: options.toolVersion ?? action.version }
            : {}),
        }),
      }
    );

    const successful = payload.successful !== false;
    const error = successful ? undefined : (payload.error ?? "Tool execution failed.");

    return {
      successful,
      data: payload.data,
      ...(error ? { error } : {}),
      ...(error ? { errorInfo: classifyCliError(error) } : {}),
      logId: payload.log_id,
      toolSlug: action.slug,
      toolkitSlug: action.toolkitSlug,
      version: options.toolVersion ?? action.version,
      userId: options.userId,
      input: options.input,
    };
  }

  private async fetchToolkitActions(toolkitSlug: string, toolPrefix: string): Promise<ToolkitAction[]> {
    const payload = await this.requestJSON<ProxyToolListPayload>(
      `/toolkits/${encodeURIComponent(toolkitSlug)}/tools?limit=9999`
    );
    return (payload.items ?? [])
      .filter(tool => typeof tool.slug === "string" && typeof tool.name === "string")
      .map(tool =>
        buildToolkitAction(toolPrefix, {
          slug: tool.slug!,
          name: tool.name!,
          description: tool.description,
          version: tool.version,
          isDeprecated: tool.is_deprecated,
          inputParameters: tool.input_parameters,
          outputParameters: tool.output_parameters,
          ...(tool.toolkit?.slug
            ? {
                toolkit: {
                  slug: tool.toolkit.slug,
                  name: tool.toolkit.name ?? tool.toolkit.slug,
                },
              }
            : {
                toolkit: {
                  slug: toolkitSlug,
                  name: toolkitSlug,
                },
              }),
        })
      )
      .sort((left, right) => left.cliName.localeCompare(right.cliName));
  }

  private async fetchConnectedAccounts(options: {
    toolkitSlugs?: string[];
    userId?: string;
    statuses?: string[];
  }): Promise<ProxyConnectedAccountsPayload> {
    const params = new URLSearchParams();
    for (const toolkitSlug of options.toolkitSlugs ?? []) {
      params.append("toolkit_slugs", toolkitSlug);
    }
    for (const status of options.statuses ?? []) {
      params.append("statuses", status);
    }
    if (options.userId?.trim()) {
      params.append("user_ids", options.userId.trim());
    }

    const payload = await this.requestJSON<ProxyConnectedAccountsPayload>(
      `/connected-accounts${params.size > 0 ? `?${params.toString()}` : ""}`
    );

    const resolvedUserId = normalizeUserId(payload.user_id);
    if (resolvedUserId) {
      this.defaultUserIdPromise = Promise.resolve(resolvedUserId);
    }

    return payload;
  }

  private async fetchDefaultUserId(): Promise<string | undefined> {
    const payload = await this.fetchConnectedAccounts({ statuses: ["ACTIVE"] });
    return normalizeUserId(payload.user_id);
  }

  private async requestJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set("x-api-key", this.apiKey);
    if (init.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await this.fetchImpl(`${this.proxyBaseUrl}${path}`, {
      ...init,
      headers,
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(buildHTTPErrorMessage(response.status, response.statusText, raw));
    }
    if (raw.trim() === "") {
      return {} as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Invalid JSON returned from backend proxy endpoint '${path}'.`);
    }
  }
}

function deriveProxyBaseUrl(proxyUrl: string): string {
  return proxyUrl.replace(/\/mcp\/?$/i, "");
}

function normalizeUserId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildHTTPErrorMessage(status: number, statusText: string, raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      error?: {
        message?: string;
      } | string;
    };
    const message =
      (typeof parsed.error === "object" && parsed.error?.message) ||
      (typeof parsed.error === "string" ? parsed.error : undefined) ||
      parsed.message;
    if (message) {
      return `${status} ${statusText}: ${message}`;
    }
  } catch {
    // Ignore parse errors and fall back to the raw body.
  }

  const detail = raw.trim();
  return detail ? `${status} ${statusText}: ${detail}` : `${status} ${statusText}`;
}
