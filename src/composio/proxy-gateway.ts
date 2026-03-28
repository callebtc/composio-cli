import { CLI_NAME, DEFAULT_USER_ID } from "../constants.js";
import { classifyCliError } from "../errors.js";
import { buildToolkitAction } from "../toolkits/actions.js";
import { SUPPORTED_TOOLKITS } from "../toolkits/index.js";
import type {
  ComposioGateway,
  ConnectedAccountSummary,
  ExecuteActionResult,
  GatewayFactoryOptions,
  JsonSchemaObject,
  ToolkitAction,
} from "../types.js";
import { normalizeToken } from "../utils/strings.js";

const MCP_PROTOCOL_VERSION = "2025-03-26";
const ACTION_VERBS = new Set([
  "LIST",
  "GET",
  "FIND",
  "FETCH",
  "CREATE",
  "UPDATE",
  "PATCH",
  "DELETE",
  "SEND",
  "SEARCH",
  "READ",
  "WRITE",
  "APPEND",
  "MOVE",
  "UPLOAD",
  "JOIN",
  "EDIT",
  "POST",
  "LOOKUP",
  "EXPORT",
  "IMPORT",
  "SYNC",
  "WATCH",
]);

interface ProxyGatewayOptions {
  apiKey: string;
  proxyUrl: string;
  fetchImpl?: typeof fetch;
  clientVersion?: string;
}

interface MCPTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: JsonSchemaObject;
}

interface JSONRPCResponseEnvelope {
  id?: string | number | null;
  jsonrpc?: string;
  result?: unknown;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
}

export function createProxyComposioGateway(options: ProxyGatewayOptions): ComposioGateway {
  return new ProxyComposioGateway(options);
}

export class ProxyComposioGateway implements ComposioGateway {
  private readonly apiKey: string;
  private readonly proxyUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly clientVersion: string;
  private readonly actionCache = new Map<string, Promise<ToolkitAction[]>>();
  private allToolsPromise?: Promise<MCPTool[]>;
  private initializePromise?: Promise<void>;
  private sessionID?: string;
  private requestID = 0;

  constructor(options: ProxyGatewayOptions) {
    this.apiKey = options.apiKey;
    this.proxyUrl = options.proxyUrl;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.clientVersion = options.clientVersion ?? "0.0.0";
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
    if (options.statuses && !options.statuses.includes("ACTIVE")) {
      return [];
    }

    const actions = await this.getAllDiscoveredActions();
    const userID = options.userId?.trim() || DEFAULT_USER_ID;
    const requestedToolkits = new Set(
      (options.toolkitSlugs ?? []).map(toolkitSlug => compactToolkitToken(toolkitSlug))
    );
    const seen = new Set<string>();

    return actions
      .filter(action => {
        const compactToolkitSlug = compactToolkitToken(action.toolkitSlug);
        if (requestedToolkits.size > 0 && !requestedToolkits.has(compactToolkitSlug)) {
          return false;
        }
        if (seen.has(compactToolkitSlug)) {
          return false;
        }
        seen.add(compactToolkitSlug);
        return true;
      })
      .map(action => ({
        id: `proxy:${action.toolkitSlug}`,
        status: "ACTIVE",
        toolkitSlug: action.toolkitSlug,
        userId: userID,
        isDisabled: false,
      }));
  }

  async executeAction(
    action: ToolkitAction,
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string | undefined;
    }
  ): Promise<ExecuteActionResult> {
    await this.ensureInitialized();
    const result = await this.callJSONRPC("tools/call", {
      name: action.slug,
      arguments: options.input,
    });

    const successful = !isProxyToolError(result);
    const error = successful ? undefined : extractProxyToolError(result);
    const data = extractProxyToolData(result);

    return {
      successful,
      data,
      ...(error ? { error } : {}),
      ...(error ? { errorInfo: classifyCliError(error) } : {}),
      toolSlug: action.slug,
      toolkitSlug: action.toolkitSlug,
      version: options.toolVersion ?? action.version,
      userId: options.userId,
      input: options.input,
    };
  }

  private async fetchToolkitActions(toolkitSlug: string, toolPrefix: string): Promise<ToolkitAction[]> {
    const tools = await this.getAllTools();
    return tools
      .filter(tool => toolMatchesToolkit(tool, toolkitSlug, toolPrefix))
      .map(tool => buildProxyToolkitAction(tool, toolkitSlug, toolPrefix))
      .sort((left, right) => left.cliName.localeCompare(right.cliName));
  }

  private async getAllDiscoveredActions(): Promise<ToolkitAction[]> {
    const tools = await this.getAllTools();
    return tools
      .map(tool => {
        const metadata = deriveProxyToolkitMetadata(tool.name);
        return buildProxyToolkitAction(tool, metadata.toolkitSlug, metadata.toolPrefix);
      })
      .sort((left, right) => {
        const toolkitComparison = left.toolkitSlug.localeCompare(right.toolkitSlug);
        if (toolkitComparison !== 0) {
          return toolkitComparison;
        }
        return left.cliName.localeCompare(right.cliName);
      });
  }

  private async getAllTools(): Promise<MCPTool[]> {
    if (!this.allToolsPromise) {
      this.allToolsPromise = this.fetchAllTools();
    }
    return this.allToolsPromise;
  }

  private async fetchAllTools(): Promise<MCPTool[]> {
    await this.ensureInitialized();
    const result = await this.callJSONRPC("tools/list", {});
    const tools = extractToolsList(result);
    return tools.sort((left, right) => left.name.localeCompare(right.name));
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = this.initializeSession();
    }
    return this.initializePromise;
  }

  private async initializeSession(): Promise<void> {
    await this.callJSONRPC("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: CLI_NAME,
        version: this.clientVersion,
      },
    });
    try {
      await this.callJSONRPC("notifications/initialized", {}, { notification: true });
    } catch (error) {
      if (isMethodNotFoundError(error)) {
        return;
      }
      throw error;
    }
  }

  private async callJSONRPC(
    method: string,
    params: unknown,
    options: {
      notification?: boolean;
    } = {}
  ): Promise<unknown> {
    const requestID = String(++this.requestID);
    const body = JSON.stringify({
      jsonrpc: "2.0",
      ...(options.notification ? {} : { id: requestID }),
      method,
      ...(params !== undefined ? { params } : {}),
    });

    const response = await this.fetchImpl(this.proxyUrl, {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        ...(this.sessionID ? { "mcp-session-id": this.sessionID } : {}),
      },
      body,
    });

    const sessionID = response.headers.get("mcp-session-id");
    if (sessionID) {
      this.sessionID = sessionID;
    }

    const raw = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      throw new Error(buildHTTPErrorMessage(response.status, response.statusText, raw, contentType));
    }
    if (raw.trim() === "") {
      return undefined;
    }

    const payload = parseJSONRPCEnvelope(raw, contentType, method);

    if (payload.error) {
      throw new Error(
        `MCP ${method} failed${payload.error.code !== undefined ? ` (${payload.error.code})` : ""}: ${payload.error.message ?? "Unknown error"}.`
      );
    }
    if (options.notification) {
      return undefined;
    }
    if (!("result" in payload)) {
      throw new Error(`MCP ${method} response was missing a result.`);
    }

    return payload.result;
  }
}

export function buildProxyToolkitAction(
  tool: MCPTool,
  toolkitSlug: string,
  toolPrefix: string
): ToolkitAction {
  const toolkitName = resolveToolkitDisplayName(toolkitSlug);
  return buildToolkitAction(toolPrefix, {
    slug: tool.name,
    name: tool.title ?? tool.name,
    description: tool.description,
    inputParameters: tool.inputSchema,
    ...(toolkitName
      ? {
          toolkit: {
            slug: toolkitSlug,
            name: toolkitName,
          },
        }
      : {}),
  });
}

export function deriveProxyToolkitMetadata(toolName: string): {
  toolkitSlug: string;
  toolPrefix: string;
} {
  const toolPrefix = deriveToolPrefix(toolName);
  const compactPrefix = compactToolkitToken(toolPrefix);
  const supportedToolkit = SUPPORTED_TOOLKITS.find(
    toolkit => compactToolkitToken(toolkit.toolPrefix) === compactPrefix
  );

  return {
    toolPrefix,
    toolkitSlug: supportedToolkit?.apiSlug ?? toolPrefix.toLowerCase(),
  };
}

function toolMatchesToolkit(tool: MCPTool, toolkitSlug: string, toolPrefix: string): boolean {
  const normalizedToolkit = compactToolkitToken(toolkitSlug);
  const normalizedPrefix = compactToolkitToken(toolPrefix);
  const metadata = deriveProxyToolkitMetadata(tool.name);
  return (
    compactToolkitToken(metadata.toolkitSlug) === normalizedToolkit ||
    compactToolkitToken(metadata.toolPrefix) === normalizedPrefix
  );
}

function deriveToolPrefix(toolName: string): string {
  const segments = toolName
    .trim()
    .split("_")
    .map(segment => segment.trim())
    .filter(Boolean);

  for (let index = 1; index < segments.length; index += 1) {
    const remaining = segments.slice(index);
    const first = remaining[0];
    const last = remaining[remaining.length - 1];
    if ((first && ACTION_VERBS.has(first)) || (last && ACTION_VERBS.has(last))) {
      return segments.slice(0, index).join("_");
    }
  }

  return segments[0] ?? toolName.trim();
}

function compactToolkitToken(value: string): string {
  return normalizeToken(value).replace(/-/g, "");
}

function resolveToolkitDisplayName(toolkitSlug: string): string | undefined {
  return SUPPORTED_TOOLKITS.find(toolkit => toolkit.apiSlug === toolkitSlug)?.displayName;
}

function extractToolsList(result: unknown): MCPTool[] {
  if (!isRecord(result) || !Array.isArray(result.tools)) {
    throw new Error("MCP tools/list response did not include a tools array.");
  }

  return result.tools
    .filter(isRecord)
    .filter(tool => typeof tool.name === "string")
    .map(tool => ({
      name: tool.name as string,
      ...(typeof tool.title === "string" ? { title: tool.title } : {}),
      ...(typeof tool.description === "string" ? { description: tool.description } : {}),
      ...(isRecord(tool.inputSchema) ? { inputSchema: tool.inputSchema as JsonSchemaObject } : {}),
    }));
}

function extractProxyToolData(result: unknown): unknown {
  if (!isRecord(result)) {
    return result;
  }
  if ("structuredContent" in result) {
    return result.structuredContent;
  }
  if (Array.isArray(result.content)) {
    const content = result.content
      .filter(isRecord)
      .map(entry => {
        if (typeof entry.text === "string") {
          return parseMaybeJSON(entry.text);
        }
        if ("json" in entry) {
          return entry.json;
        }
        return entry;
      });
    if (content.length === 1) {
      return content[0];
    }
    if (content.length > 1) {
      return content;
    }
  }
  return result;
}

function isProxyToolError(result: unknown): boolean {
  return isRecord(result) && result.isError === true;
}

function extractProxyToolError(result: unknown): string {
  if (!isRecord(result)) {
    return "Tool execution failed.";
  }
  if (Array.isArray(result.content)) {
    const messages = result.content
      .filter(isRecord)
      .map(entry => {
        if (typeof entry.text === "string" && entry.text.trim()) {
          return entry.text.trim();
        }
        return undefined;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return "Tool execution failed.";
}

function parseMaybeJSON(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseJSONRPCEnvelope(
  raw: string,
  contentType: string,
  method: string
): JSONRPCResponseEnvelope {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return {};
  }

  let parsed: unknown;
  if (isEventStream(contentType)) {
    parsed = parseSSEJSONPayload(trimmed);
  } else {
    parsed = parseMaybeJSON(trimmed);
  }

  if (!isRecord(parsed)) {
    throw new Error(`MCP ${method} returned invalid JSON.`);
  }

  return parsed as JSONRPCResponseEnvelope;
}

function parseSSEJSONPayload(raw: string): unknown {
  const events = raw
    .split(/\n\n+/)
    .map(chunk => chunk.trim())
    .filter(Boolean);

  for (const event of events) {
    const dataLines = event
      .split("\n")
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trim())
      .filter(Boolean);
    if (dataLines.length === 0) {
      continue;
    }

    const payload = dataLines.join("\n");
    if (payload === "[DONE]") {
      continue;
    }

    const parsed = parseMaybeJSON(payload);
    if (isRecord(parsed)) {
      return parsed;
    }
  }

  throw new Error("MCP response event stream did not include a JSON payload.");
}

function buildHTTPErrorMessage(status: number, statusText: string, raw: string, contentType: string): string {
  let parsed: unknown;
  try {
    parsed = isEventStream(contentType) ? parseSSEJSONPayload(raw.trim()) : parseMaybeJSON(raw);
  } catch {
    parsed = raw;
  }

  if (isRecord(parsed)) {
    const nestedError = isRecord(parsed.error) ? parsed.error : undefined;
    const message =
      (typeof nestedError?.message === "string" && nestedError.message) ||
      (typeof parsed.message === "string" && parsed.message);
    if (message) {
      return `${status} ${statusText}: ${message}`;
    }
  }
  const detail = raw.trim();
  if (detail) {
    return `${status} ${statusText}: ${detail}`;
  }
  return `${status} ${statusText}`;
}

function isEventStream(contentType: string): boolean {
  return contentType.toLowerCase().includes("text/event-stream");
}

function isMethodNotFoundError(error: unknown): boolean {
  return error instanceof Error && /\(-32601\): Method not found\./.test(error.message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
