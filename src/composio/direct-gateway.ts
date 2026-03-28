import { Composio, ComposioProvider } from "@composio/core";
import type { Tool } from "@composio/core";
import { DEFAULT_COMPOSIO_BASE_URL, MAX_ACTIONS_PER_TOOLKIT } from "../constants.js";
import { classifyCliError } from "../errors.js";
import { buildToolkitAction } from "../toolkits/actions.js";
import type {
  ComposioGateway,
  ConnectedAccountSummary,
  ExecuteActionResult,
  GatewayFactoryOptions,
  ToolkitAction,
} from "../types.js";

export function createDirectComposioGateway(options: GatewayFactoryOptions): ComposioGateway {
  return new DirectComposioGateway(options);
}

class DirectComposioGateway implements ComposioGateway {
  private readonly composio: Composio<ComposioProvider>;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly actionCache = new Map<string, Promise<ToolkitAction[]>>();

  constructor(options: GatewayFactoryOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_COMPOSIO_BASE_URL;
    this.composio = new Composio({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      provider: new ComposioProvider(),
    });
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
    const url = new URL("/api/v3/connected_accounts", this.baseUrl);
    for (const toolkitSlug of options.toolkitSlugs ?? []) {
      url.searchParams.append("toolkit_slugs", toolkitSlug);
    }
    for (const status of options.statuses ?? []) {
      url.searchParams.append("statuses", status);
    }
    if (options.userId) {
      url.searchParams.append("user_ids", options.userId);
    }

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Connected account lookup failed with ${response.status} ${response.statusText}.`
      );
    }

    const payload = (await response.json()) as {
      items?: Array<{
        id?: string;
        status?: string;
        user_id?: string;
        is_disabled?: boolean;
        toolkit?: {
          slug?: string;
        };
      }>;
    };

    return (payload.items ?? [])
      .filter(item => typeof item.id === "string" && typeof item.toolkit?.slug === "string")
      .map(item => ({
        id: item.id!,
        status: item.status,
        toolkitSlug: item.toolkit!.slug!,
        userId: item.user_id,
        isDisabled: item.is_disabled,
      }));
  }

  async executeAction(
    action: ToolkitAction,
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string;
    }
  ): Promise<ExecuteActionResult> {
    const executeVersion = options.toolVersion ?? action.version;
    const result = await this.composio.tools.execute(action.slug, {
      userId: options.userId,
      arguments: options.input,
      ...(executeVersion ? { version: executeVersion } : {}),
      ...(executeVersion === undefined || executeVersion === "latest"
        ? { dangerouslySkipVersionCheck: true }
        : {}),
    });

    return {
      successful: result.successful,
      data: result.data,
      error: result.error,
      ...(result.error ? { errorInfo: classifyCliError(result.error) } : {}),
      logId: result.logId,
      sessionInfo: result.sessionInfo,
      toolSlug: action.slug,
      toolkitSlug: action.toolkitSlug,
      version: executeVersion,
      userId: options.userId,
      input: options.input,
    };
  }

  private async fetchToolkitActions(toolkitSlug: string, toolPrefix: string): Promise<ToolkitAction[]> {
    const tools = await this.composio.tools.getRawComposioTools({
      toolkits: [toolkitSlug],
      limit: MAX_ACTIONS_PER_TOOLKIT,
      important: false,
    });

    return [...tools]
      .map(tool => buildToolkitAction(toolPrefix, tool as Tool))
      .sort((left, right) => left.cliName.localeCompare(right.cliName));
  }
}
