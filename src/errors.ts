import type { CliErrorInfo, CliErrorKind } from "./types.js";

const HTTP_STATUS_PATTERN = /\b([1-5]\d{2})\b/;

export function classifyCliError(error: unknown, options: {
  suggestion?: string;
} = {}): CliErrorInfo {
  const message = formatErrorMessage(error);
  const normalized = message.toLowerCase();
  const statusCode = extractStatusCode(message);
  const kind = classifyErrorKind(normalized, statusCode);

  return {
    kind,
    message,
    statusCode,
    suggestion: options.suggestion,
    rawMessage: message,
  };
}

export function renderCliError(error: CliErrorInfo): string {
  const lines = [`Error [${error.kind}]: ${error.message}`];
  if (error.suggestion) {
    lines.push(error.suggestion);
  }
  lines.push("");
  return lines.join("\n");
}

export function buildCliErrorEnvelope(error: CliErrorInfo, options: {
  toolkit?: string;
  action?: string;
} = {}): {
  successful: false;
  error: CliErrorInfo;
  toolkit?: string;
  action?: string;
} {
  return {
    successful: false,
    error,
    ...(options.toolkit ? { toolkit: options.toolkit } : {}),
    ...(options.action ? { action: options.action } : {}),
  };
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message ?? "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error === undefined || error === null) {
    return "Unknown error";
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function classifyErrorKind(normalizedMessage: string, statusCode?: number): CliErrorKind {
  if (
    statusCode === 401 ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("missing composio api key") ||
    normalizedMessage.includes("invalid api key") ||
    normalizedMessage.includes("authentication")
  ) {
    return "auth";
  }

  if (
    normalizedMessage.includes("no active connected account") ||
    normalizedMessage.includes("is disabled for user") ||
    normalizedMessage.includes("not connected") ||
    normalizedMessage.includes("no connected toolkits") ||
    normalizedMessage.includes("no calendar availability returned")
  ) {
    return "no_connection";
  }

  if (
    statusCode === 403 ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("not allowed")
  ) {
    return "permission";
  }

  if (
    statusCode === 429 ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "rate_limit";
  }

  if (
    normalizedMessage.startsWith("input error:") ||
    normalizedMessage.includes("missing required fields") ||
    normalizedMessage.includes("expects a value") ||
    normalizedMessage.includes("invalid --set expression") ||
    normalizedMessage.includes("unexpected positional argument") ||
    normalizedMessage.includes("empty flag name") ||
    normalizedMessage.includes("unknown action") ||
    normalizedMessage.includes("unknown toolkit") ||
    normalizedMessage.includes("does not support --fields") ||
    normalizedMessage.includes("does not support --ids-only") ||
    normalizedMessage.includes("use either --json") ||
    normalizedMessage.includes("use either --full") ||
    normalizedMessage.includes("use either --ids-only") ||
    normalizedMessage.includes("unknown summary field")
  ) {
    return "validation";
  }

  if (
    (statusCode !== undefined && statusCode >= 500) ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("lookup failed") ||
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("network")
  ) {
    return "server";
  }

  return "server";
}

function extractStatusCode(message: string): number | undefined {
  const match = message.match(HTTP_STATUS_PATTERN);
  if (!match) {
    return undefined;
  }
  const code = Number(match[1]);
  return Number.isFinite(code) ? code : undefined;
}
