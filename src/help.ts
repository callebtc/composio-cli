import { API_KEY_ENV, CLI_NAME, DEFAULT_USER_ID, TOOLKIT_PREVIEW_LIMIT } from "./constants.js";
import { classifyCliError } from "./errors.js";
import type {
  CliDisplayOptions,
  ConnectedAccountSummary,
  ExecuteActionResult,
  JsonSchemaObject,
  JsonSchemaProperty,
  ToolkitAction,
} from "./types.js";
import { getDisplayActionAliases } from "./toolkits/actions.js";
import { hasSummaryDefault, renderSummarizedExecutionResult } from "./toolkits/output.js";
import type { ToolkitDefinition } from "./toolkits/shared.js";
import { indent, pluralize, titleCaseWords, toFlagName, truncate } from "./utils/strings.js";

export function renderRootHelp(options: {
  hasApiKey: boolean;
  userId?: string;
  enabledToolkits?: ToolkitDefinition[];
}): string {
  const enabledToolkits = options.enabledToolkits ?? [];
  const toolkitLines = enabledToolkits.map(toolkit => formatRow(toolkit.cliName, toolkit.summary, 20));
  return [
    `${CLI_NAME} — agent-first CLI for Composio toolkits`,
    "",
    "Usage:",
    `  ${CLI_NAME} <toolkit> [action] [options]`,
    "",
    "Authentication:",
    `  - Pass --api-key <key>, or set ${API_KEY_ENV}.`,
    `  - Pass --user <id> to target a specific Composio user. Default: ${DEFAULT_USER_ID}.`,
    "",
    options.hasApiKey
      ? `Connected toolkit discovery is scoped to user '${options.userId ?? DEFAULT_USER_ID}'.`
      : "Authenticate first to discover the connected toolkit commands relevant to this agent.",
    "",
    "Start here:",
    options.hasApiKey && enabledToolkits.length > 0
      ? `  1. Pick an enabled toolkit:  ${CLI_NAME} ${enabledToolkits[0]!.cliName}`
      : `  1. Discover toolkits:        ${CLI_NAME} toolkits --api-key <key>`,
    `  2. See live connections:      ${CLI_NAME} connections --api-key <key>`,
    `  3. Inspect one action:        ${CLI_NAME} <toolkit> inspect <action> --api-key <key>`,
    `  4. Run it with flags:         ${CLI_NAME} <toolkit> <action> --flag value --api-key <key>`,
    `  5. Run it with JSON:          ${CLI_NAME} <toolkit> <action> --input '{"key":"value"}' --api-key <key>`,
    `  6. Trim text output:          ${CLI_NAME} <toolkit> <action> --fields id,summary --api-key <key>`,
    "",
    ...(options.hasApiKey
      ? enabledToolkits.length > 0
        ? [
            `Enabled toolkits for user '${options.userId ?? DEFAULT_USER_ID}':`,
            ...toolkitLines.map(line => `  ${line}`),
          ]
        : [
            `No active connected toolkits were found for user '${options.userId ?? DEFAULT_USER_ID}'.`,
            `Run '${CLI_NAME} connections --api-key <key>' to inspect available connected accounts and user IDs.`,
          ]
      : [
          `Run '${CLI_NAME} toolkits --api-key <key>' after authentication to show only connected toolkit commands.`,
        ]),
    "",
  ].join("\n");
}

export function renderToolkitList(toolkits: ToolkitDefinition[], userId: string): string {
  const lines = [
    `${pluralize(toolkits.length, "enabled toolkit")} for user '${userId}':`,
    ...toolkits.map(toolkit => {
      const capabilities = toolkit.capabilities.join(", ");
      return `  ${toolkit.cliName.padEnd(20)}${toolkit.displayName} — ${capabilities}`;
    }),
    "",
  ];
  return lines.join("\n");
}

export function renderToolkitGuide(toolkit: ToolkitDefinition, actions?: ToolkitAction[]): string {
  const lines = [
    `${toolkit.displayName} — ${toolkit.summary}`,
    "",
    "Usage:",
    `  ${CLI_NAME} ${toolkit.cliName} <action> [options]`,
    "",
    "Guide:",
    `  1. List every action:     ${CLI_NAME} ${toolkit.cliName} actions`,
    `  2. Inspect one action:    ${CLI_NAME} ${toolkit.cliName} inspect <action>`,
    `  3. Run it with flags:     ${CLI_NAME} ${toolkit.cliName} <action> --flag value`,
    `  4. Run it with JSON:      ${CLI_NAME} ${toolkit.cliName} <action> --input '{"key":"value"}'`,
    `  5. Pipe JSON from stdin:  echo '{"key":"value"}' | ${CLI_NAME} ${toolkit.cliName} <action>`,
    `  6. Trim text output:      ${CLI_NAME} ${toolkit.cliName} <action> --fields id,summary`,
    "",
    "Suggested starting actions:",
    ...toolkit.examples.map(example => `  ${CLI_NAME} ${toolkit.cliName} inspect ${example}`),
  ];

  if (actions && actions.length > 0) {
    lines.push("", `Discovered actions (${actions.length} total, showing ${Math.min(actions.length, TOOLKIT_PREVIEW_LIMIT)}):`);
    actions.slice(0, TOOLKIT_PREVIEW_LIMIT).forEach(action => {
      lines.push(`  ${formatActionRow(action)}`);
    });
    if (actions.length > TOOLKIT_PREVIEW_LIMIT) {
      lines.push(`  ... run '${CLI_NAME} ${toolkit.cliName} actions' to see the full list.`);
    }
  } else {
    lines.push("", "Live action preview:");
    lines.push(`  Provide --api-key or set ${API_KEY_ENV} to fetch the current action list from Composio.`);
  }

  lines.push("");
  return lines.join("\n");
}

export function renderActionList(toolkit: ToolkitDefinition, actions: ToolkitAction[]): string {
  const lines = [
    `${toolkit.displayName} actions (${actions.length})`,
    "",
    "Usage:",
    `  ${CLI_NAME} ${toolkit.cliName} inspect <action>`,
    `  ${CLI_NAME} ${toolkit.cliName} <action> [options]`,
    "",
    "Actions:",
    ...actions.map(action => `  ${formatActionRow(action)}`),
    "",
  ];
  return lines.join("\n");
}

export function renderActionGuide(
  toolkit: ToolkitDefinition,
  action: ToolkitAction,
  options: {
    allParameters?: boolean;
  } = {}
): string {
  const inputSchema = action.inputSchema;
  const required = inputSchema?.required ?? [];
  const propertyDisplay = renderSchemaProperties(inputSchema, {
    allParameters: options.allParameters ?? false,
  });
  const exampleFlags = buildExampleFlags(inputSchema);
  const exampleJson = buildExampleJson(inputSchema);
  const aliases = getDisplayActionAliases(action);

  const lines = [
    `${toolkit.displayName} / ${action.cliName}`,
    action.description ? `Description: ${action.description}` : undefined,
    aliases.length > 0 ? `Also accepts: ${aliases.join(", ")}` : undefined,
    "",
    "How to run:",
    exampleFlags
      ? `  ${CLI_NAME} ${toolkit.cliName} ${action.cliName} ${exampleFlags}`.trimEnd()
      : `  ${CLI_NAME} ${toolkit.cliName} ${action.cliName}`,
    exampleJson
      ? `  ${CLI_NAME} ${toolkit.cliName} ${action.cliName} --input '${exampleJson}'`
      : `  ${CLI_NAME} ${toolkit.cliName} ${action.cliName} --input '{}'`,
    `  echo '${exampleJson ?? "{}"}' | ${CLI_NAME} ${toolkit.cliName} ${action.cliName}`,
    "",
    "Input options:",
    `  --input <json>          Pass the full tool input as a JSON object.`,
    `  --set key=value         Patch one field at a time. Supports dots and [index] paths.`,
    ...propertyDisplay.lines,
    propertyDisplay.hiddenSummary ? `  ${propertyDisplay.hiddenSummary}` : undefined,
    "",
    hasSummaryDefault(toolkit, action)
      ? `Default text output is summarized for this ${toolkit.displayName} action. Use --json for the full response.`
      : undefined,
    hasSummaryDefault(toolkit, action)
      ? "Output controls: --fields a,b, --ids-only, --full, --json"
      : "Output controls: --json",
    propertyDisplay.hiddenSummary && !(options.allParameters ?? false)
      ? "Use --all-parameters to show every optional input field."
      : undefined,
    "",
    required.length > 0
      ? `Required top-level fields: ${required.join(", ")}`
      : "Required top-level fields: none",
    "",
  ].filter((line): line is string => line !== undefined);

  return lines.join("\n");
}

export function renderConnections(
  accounts: ConnectedAccountSummary[],
  options: {
    userId?: string;
    enabledToolkits?: ToolkitDefinition[];
  }
): string {
  const lines = options.userId
    ? [
        `Connections for user '${options.userId}'`,
        "",
        ...(options.enabledToolkits ?? []).map(toolkit => {
          const account = accounts.find(item => item.toolkitSlug === toolkit.apiSlug && !item.isDisabled);
          return `  ${toolkit.cliName.padEnd(20)}${account ? "connected" : "not connected"}`;
        }),
      ]
    : [
        "Connected accounts across available users",
        "",
        ...(accounts.length > 0
          ? accounts.map(
              account =>
                `  ${String(account.userId ?? "unknown").padEnd(18)}${account.toolkitSlug.padEnd(20)}${account.status ?? "UNKNOWN"}`
            )
          : ["  No connected accounts found."]),
      ];
  lines.push("");
  return lines.join("\n");
}

export function renderExecutionResult(result: {
  action: ToolkitAction;
  toolkit: ToolkitDefinition;
  execution: ExecuteActionResult;
  display: CliDisplayOptions;
}): string {
  const { action, toolkit, execution, display } = result;
  if (!display.full) {
    const summarized = renderSummarizedExecutionResult({
      action,
      toolkit,
      execution: result.execution,
      display,
    });
    if (summarized) {
      return summarized;
    }
  }

  if (!execution.successful) {
    const errorInfo = execution.errorInfo ?? classifyCliError(execution.error ?? "Action execution failed.");
    return [
      `${toolkit.displayName} / ${action.cliName}`,
      `Error: ${errorInfo.message}`,
      `Error type: ${errorInfo.kind}`,
      execution.data !== undefined && execution.data !== null
        ? `\nData:\n${indent(JSON.stringify(execution.data, null, 2), 2)}`
        : undefined,
      "",
    ]
      .filter((line): line is string => line !== undefined)
      .join("\n");
  }

  return [
    `${toolkit.displayName} / ${action.cliName}`,
    "Data:",
    indent(JSON.stringify(execution.data === undefined ? null : execution.data, null, 2), 2),
    "",
  ].join("\n");
}

function renderSchemaProperties(
  schema: JsonSchemaObject | undefined,
  options: {
    allParameters: boolean;
  }
): {
  lines: string[];
  hiddenSummary?: string;
} {
  const properties = schema?.properties ?? {};
  const required = new Set(schema?.required ?? []);
  const keys = Object.keys(properties).sort();

  if (keys.length === 0) {
    return {
      lines: ["  This tool does not expose any top-level input fields."],
    };
  }

  const { visibleKeys, hiddenKeys } = selectDisplayPropertyKeys(keys, required, options.allParameters);
  return {
    lines: visibleKeys.map(key => {
      const property = properties[key]!;
      const flagName = `--${toFlagName(key)}`;
      const descriptor = [
        propertyTypeLabel(property),
        required.has(key) ? "required" : "optional",
        property.default !== undefined ? `default=${JSON.stringify(property.default)}` : undefined,
      ]
        .filter(Boolean)
        .join(", ");
      const description = property.description ? truncate(property.description, 80) : "No description.";
      return `  ${flagName.padEnd(22)}${descriptor} — ${description}`;
    }),
    ...(hiddenKeys.length > 0
      ? {
          hiddenSummary: `Optional input fields hidden (${hiddenKeys.length}): ${hiddenKeys
            .slice(0, 5)
            .map(key => `--${toFlagName(key)}`)
            .join(", ")}${hiddenKeys.length > 5 ? ", ..." : ""}.`,
        }
      : {}),
  };
}

function selectDisplayPropertyKeys(
  keys: string[],
  required: Set<string>,
  allParameters: boolean
): {
  visibleKeys: string[];
  hiddenKeys: string[];
} {
  const minimumVisible = 5;
  if (allParameters || keys.length <= minimumVisible) {
    return {
      visibleKeys: keys,
      hiddenKeys: [],
    };
  }

  const included = new Set<string>();
  keys.forEach(key => {
    if (required.has(key)) {
      included.add(key);
    }
  });

  for (const key of keys) {
    if (included.size >= minimumVisible) {
      break;
    }
    included.add(key);
  }

  return {
    visibleKeys: keys.filter(key => included.has(key)),
    hiddenKeys: keys.filter(key => !included.has(key)),
  };
}

function buildExampleFlags(schema?: JsonSchemaObject): string {
  const properties = schema?.properties ?? {};
  const required = schema?.required ?? [];
  const keys = required.length > 0 ? required : Object.keys(properties).slice(0, 2);
  return keys
    .map(key => `--${toFlagName(key)} ${placeholderForProperty(properties[key], key)}`)
    .join(" ");
}

function buildExampleJson(schema?: JsonSchemaObject): string | undefined {
  const properties = schema?.properties ?? {};
  const required = schema?.required ?? [];
  const keys = required.length > 0 ? required : Object.keys(properties).slice(0, 2);
  if (keys.length === 0) {
    return undefined;
  }

  const example = Object.fromEntries(
    keys.map(key => [key, exampleValueForProperty(properties[key], key)])
  );
  return JSON.stringify(example);
}

function placeholderForProperty(property: JsonSchemaProperty | undefined, key: string): string {
  const type = propertyTypeLabel(property);
  if (type === "integer" || type === "number") {
    return "<number>";
  }
  if (type === "boolean") {
    return "<true|false>";
  }
  if (type === "array") {
    return "'[]'";
  }
  if (type === "object") {
    return "'{}'";
  }
  return `<${toFlagName(key)}>`;
}

function exampleValueForProperty(property: JsonSchemaProperty | undefined, key: string): unknown {
  const type = propertyTypeLabel(property);
  if (type === "integer" || type === "number") {
    return 1;
  }
  if (type === "boolean") {
    return true;
  }
  if (type === "array") {
    return [];
  }
  if (type === "object") {
    return {};
  }
  return `<${key}>`;
}

function propertyTypeLabel(property: JsonSchemaProperty | undefined): string {
  if (!property?.type) {
    return "value";
  }
  if (typeof property.type === "string") {
    return property.type;
  }
  return property.type.join("|");
}

function formatActionRow(action: ToolkitAction): string {
  const suffix = action.description ? truncate(action.description, 70) : truncate(action.name, 70);
  const deprecated = action.isDeprecated ? " [deprecated]" : "";
  return formatRow(action.cliName, `${suffix}${deprecated}`, 24);
}

function formatRow(left: string, right: string, width: number): string {
  return `${left.padEnd(width)}${right}`;
}

export function renderUnknownToolkit(
  token: string,
  enabledToolkits: ToolkitDefinition[],
  suggestion?: string
): string {
  const suggestions = enabledToolkits.map(toolkit => toolkit.cliName).join(", ");
  return [
    `Unknown toolkit '${token}'.`,
    suggestion ? `Did you mean '${suggestion}'?` : undefined,
    suggestions.length > 0
      ? `Enabled toolkits for this user: ${suggestions}`
      : `No enabled toolkits are currently available for this user.`,
    "",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

export function renderDisabledToolkit(
  toolkit: ToolkitDefinition,
  userId: string,
  enabledToolkits: ToolkitDefinition[]
): string {
  const enabled = enabledToolkits.map(entry => entry.cliName).join(", ");
  return [
    `Toolkit '${toolkit.cliName}' is disabled for user '${userId}' because there is no active connected account.`,
    enabled.length > 0
      ? `Enabled toolkits for this user: ${enabled}`
      : `No enabled toolkits are available for this user.`,
    `Run '${CLI_NAME} connections --api-key <key>' to inspect connected accounts.`,
    "",
  ].join("\n");
}

export function renderUnknownAction(
  toolkit: ToolkitDefinition,
  token: string,
  actions: ToolkitAction[],
  suggestion?: string
): string {
  const actionNames = actions.slice(0, 12).map(action => action.cliName).join(", ");
  return [
    `Unknown action '${token}' for ${toolkit.displayName}.`,
    suggestion ? `Did you mean '${suggestion}'?` : undefined,
    `Run '${CLI_NAME} ${toolkit.cliName} actions' to see every action.`,
    actionNames.length > 0 ? `Examples: ${actionNames}` : "No actions were returned for this toolkit.",
    "",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

export function renderMissingApiKey(): string {
  return [
    "Missing Composio API key.",
    `Pass --api-key <key> or set ${API_KEY_ENV}.`,
    "",
  ].join("\n");
}

export function renderInputError(message: string, toolkit: ToolkitDefinition, action?: ToolkitAction): string {
  return [
    `Input error: ${message}`,
    action
      ? `Run '${CLI_NAME} ${toolkit.cliName} inspect ${action.cliName}' to see the expected flags.`
      : `Run '${CLI_NAME} ${toolkit.cliName}' for toolkit-specific guidance.`,
    "",
  ].join("\n");
}

export function renderVersion(version: string): string {
  return `${version}\n`;
}

export function renderTopLevelHint(toolkit: ToolkitDefinition): string {
  return `${toolkit.displayName} supports ${toolkit.capabilities.map(cap => titleCaseWords(cap)).join(", ")}.`;
}
