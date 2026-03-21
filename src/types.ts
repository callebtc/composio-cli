export type JsonSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export interface JsonSchemaProperty {
  type?: JsonSchemaType | JsonSchemaType[];
  description?: string;
  title?: string;
  default?: unknown;
  nullable?: boolean;
  enum?: unknown[];
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchemaProperty | JsonSchemaProperty[];
  anyOf?: JsonSchemaProperty[];
  oneOf?: JsonSchemaProperty[];
  allOf?: JsonSchemaProperty[];
}

export interface JsonSchemaObject extends JsonSchemaProperty {
  type?: "object" | JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export type CliErrorKind =
  | "auth"
  | "no_connection"
  | "validation"
  | "permission"
  | "rate_limit"
  | "server";

export interface CliErrorInfo {
  kind: CliErrorKind;
  message: string;
  statusCode?: number | undefined;
  suggestion?: string | undefined;
  rawMessage?: string | undefined;
}

export interface CliDisplayOptions {
  allParameters: boolean;
  full: boolean;
  idsOnly: boolean;
  fields?: string[] | undefined;
}

export interface ToolkitAction {
  slug: string;
  name: string;
  description?: string | undefined;
  toolkitSlug: string;
  toolkitName?: string | undefined;
  version?: string | undefined;
  isDeprecated?: boolean | undefined;
  inputSchema?: JsonSchemaObject | undefined;
  outputSchema?: JsonSchemaObject | undefined;
  cliName: string;
  aliases: string[];
}

export interface ConnectedAccountSummary {
  id: string;
  status?: string | undefined;
  toolkitSlug: string;
  userId?: string | undefined;
  isDisabled?: boolean | undefined;
}

export interface ExecuteActionResult {
  successful: boolean;
  data: unknown;
  error?: string | null | undefined;
  errorInfo?: CliErrorInfo | undefined;
  logId?: string | undefined;
  sessionInfo?: unknown;
  toolSlug: string;
  toolkitSlug: string;
  version?: string | undefined;
  userId: string;
  input: Record<string, unknown>;
}

export interface ComposioGateway {
  listToolkitActions(toolkitSlug: string, toolPrefix: string): Promise<ToolkitAction[]>;
  listConnectedAccounts(options?: {
    toolkitSlugs?: string[];
    userId?: string;
    statuses?: string[];
  }): Promise<ConnectedAccountSummary[]>;
  executeAction(
    action: ToolkitAction,
    options: {
      userId: string;
      input: Record<string, unknown>;
      toolVersion?: string | undefined;
    }
  ): Promise<ExecuteActionResult>;
}

export interface CliRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CliRunOptions {
  env?: Record<string, string | undefined>;
  stdinText?: string | undefined;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
  gatewayFactory?: (options: { apiKey: string; baseUrl?: string }) => ComposioGateway;
}
