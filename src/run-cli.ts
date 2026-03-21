import { readFile } from "node:fs/promises";
import { API_KEY_ENV } from "./constants.js";
import { createComposioGateway } from "./composio/gateway.js";
import { buildCliErrorEnvelope, classifyCliError, renderCliError } from "./errors.js";
import {
  renderActionGuide,
  renderActionList,
  renderConnections,
  renderDisabledToolkit,
  renderExecutionResult,
  renderInputError,
  renderMissingApiKey,
  renderRootHelp,
  renderToolkitGuide,
  renderToolkitList,
  renderUnknownAction,
  renderUnknownToolkit,
  renderVersion,
} from "./help.js";
import { buildActionInput, parseSharedFlags, validateSharedFlags } from "./input.js";
import { resolveToolkitActionSelection } from "./toolkits/actions.js";
import { buildRuntimeToolkit, resolveToolkit } from "./toolkits/index.js";
import { hasSummaryDefault } from "./toolkits/output.js";
import type { ToolkitDefinition } from "./toolkits/shared.js";
import type { CliRunOptions, CliRunResult, ComposioGateway } from "./types.js";
import { chooseClosestIdentifier } from "./utils/identifiers.js";
import { stringifyJson } from "./utils/json.js";

export async function runCli(argv: string[], options: CliRunOptions = {}): Promise<CliRunResult> {
  const env = options.env ?? process.env;
  const jsonRequested = argv.includes("--json");
  let shared: ReturnType<typeof parseSharedFlags>;
  try {
    shared = parseSharedFlags(argv);
    validateSharedFlags(shared);
  } catch (error) {
    const classified = classifyCliError(error);
    return jsonRequested
      ? failJson(stringifyJson(buildCliErrorEnvelope(classified)))
      : fail(renderCliError(classified));
  }
  const machineOutput = shared.json;
  const remaining = shared.remainingTokens;
  const gatewayOrError = createGatewayFactory(shared.apiKey ?? env[API_KEY_ENV], shared.baseUrl, options);
  const failWithError = (
    error: unknown,
    details: {
      text?: string;
      toolkit?: ToolkitDefinition;
      action?: string;
      suggestion?: string;
    } = {}
  ) => {
    const classified = classifyCliError(error, {
      ...(details.suggestion ? { suggestion: details.suggestion } : {}),
    });
    return machineOutput
      ? failJson(
          stringifyJson(
            buildCliErrorEnvelope(classified, {
              ...(details.toolkit ? { toolkit: details.toolkit.cliName } : {}),
              ...(details.action ? { action: details.action } : {}),
            })
          )
        )
      : fail(details.text ?? renderCliError(classified));
  };

  let enabledToolkitCache: ToolkitDefinition[] | undefined;
  let connectedAccountCache:
    | Awaited<ReturnType<ComposioGateway["listConnectedAccounts"]>>
    | undefined;
  let allConnectedAccountCache:
    | Awaited<ReturnType<ComposioGateway["listConnectedAccounts"]>>
    | undefined;
  let effectiveUserIdCache: string | undefined;

  const getEffectiveUserId = async () => {
    if (shared.userProvided) {
      return shared.userId;
    }
    if (effectiveUserIdCache) {
      return effectiveUserIdCache;
    }
    if (gatewayOrError.error) {
      effectiveUserIdCache = shared.userId;
      return effectiveUserIdCache;
    }
    const accounts = await gatewayOrError.gateway!.listConnectedAccounts({
      statuses: ["ACTIVE"],
    });
    allConnectedAccountCache = accounts.filter(account => !account.isDisabled);
    const userIds = [...new Set(allConnectedAccountCache.map(account => account.userId).filter(Boolean))];
    effectiveUserIdCache = userIds.length === 1 ? userIds[0]! : shared.userId;
    return effectiveUserIdCache;
  };

  const getConnectedAccounts = async (scope: "user" | "all" = "user") => {
    if (gatewayOrError.error) {
      throw new Error(gatewayOrError.error.trim());
    }
    if (scope === "all" && allConnectedAccountCache) {
      return allConnectedAccountCache;
    }
    if (scope === "user" && connectedAccountCache) {
      return connectedAccountCache;
    }
    const effectiveUserId = await getEffectiveUserId();
    const accounts = await gatewayOrError.gateway!.listConnectedAccounts({
      ...(scope === "user" ? { userId: effectiveUserId } : {}),
      statuses: ["ACTIVE"],
    });
    if (scope === "all") {
      allConnectedAccountCache = accounts.filter(account => !account.isDisabled);
    }
    if (scope === "user") {
      connectedAccountCache = accounts.filter(account => !account.isDisabled);
    }
    return scope === "user"
      ? (connectedAccountCache ?? [])
      : (allConnectedAccountCache ?? []);
  };

  const getEnabledToolkits = async () => {
    if (enabledToolkitCache) {
      return enabledToolkitCache;
    }
    if (gatewayOrError.error) {
      enabledToolkitCache = [];
      return enabledToolkitCache;
    }
    const accounts = await getConnectedAccounts("user");
    const activeToolkits = [...new Set(accounts.map(account => account.toolkitSlug).filter(Boolean))];
    enabledToolkitCache = activeToolkits
      .map(toolkitSlug => buildRuntimeToolkit(toolkitSlug))
      .sort((left, right) => left.cliName.localeCompare(right.cliName));
    return enabledToolkitCache;
  };

  if (remaining.length === 0) {
    return ok(
      renderRootHelp({
        hasApiKey: !gatewayOrError.error,
        userId: await getEffectiveUserId().catch(() => shared.userId),
        enabledToolkits: await getEnabledToolkits().catch(() => []),
      })
    );
  }

  const [command, ...rest] = remaining;

  if (!command) {
    return ok(
      renderRootHelp({
        hasApiKey: !gatewayOrError.error,
        userId: await getEffectiveUserId().catch(() => shared.userId),
        enabledToolkits: await getEnabledToolkits().catch(() => []),
      })
    );
  }

  if (command === "--version" || command === "-v" || command === "-V" || command === "version") {
    return ok(renderVersion(await resolvePackageVersion()));
  }

  if (command === "toolkits") {
    if (gatewayOrError.error) {
      return failWithError(gatewayOrError.error, {
        text: renderMissingApiKey(),
      });
    }
    try {
      const enabledToolkits = await getEnabledToolkits();
      return machineOutput
        ? ok(stringifyJson(enabledToolkits))
        : ok(renderToolkitList(enabledToolkits, await getEffectiveUserId()));
    } catch (error) {
      return failWithError(error);
    }
  }

  if (command === "connections") {
    if (gatewayOrError.error) {
      return failWithError(gatewayOrError.error, {
        text: renderMissingApiKey(),
      });
    }
    try {
      const connections = await getConnectedAccounts(shared.userProvided ? "user" : "all");
      return machineOutput
        ? ok(
            stringifyJson({
              userId: shared.userProvided ? await getEffectiveUserId() : undefined,
              connections,
            })
          )
        : ok(renderConnections(connections, {
            ...(shared.userProvided ? { userId: await getEffectiveUserId() } : {}),
            ...(shared.userProvided ? { enabledToolkits: await getEnabledToolkits() } : {}),
          }));
    } catch (error) {
      return failWithError(error);
    }
  }

  const toolkit = resolveToolkit(command) ?? resolveToolkit(command, await getEnabledToolkits().catch(() => []));
  if (!toolkit) {
    const enabledToolkits = await getEnabledToolkits().catch(() => []);
    const toolkitSuggestion = chooseClosestIdentifier(
      command,
      enabledToolkits.map(entry => entry.cliName)
    );
    return failWithError(`Unknown toolkit '${command}'.`, {
      text: renderUnknownToolkit(command, enabledToolkits, toolkitSuggestion?.value),
      ...(toolkitSuggestion?.value
        ? { suggestion: `Did you mean '${toolkitSuggestion.value}'?` }
        : {}),
    });
  }

  if (gatewayOrError.error) {
    return failWithError(gatewayOrError.error, {
      text: renderMissingApiKey(),
      toolkit,
    });
  }

  const enabledToolkits = await getEnabledToolkits();
  const toolkitEnabled = enabledToolkits.some(entry => entry.apiSlug === toolkit.apiSlug);
  if (!toolkitEnabled) {
    return failWithError(
      `Toolkit '${toolkit.cliName}' is disabled for user '${await getEffectiveUserId()}'.`,
      {
        text: renderDisabledToolkit(toolkit, await getEffectiveUserId(), enabledToolkits),
        toolkit,
      }
    );
  }
  const commandOrAction = rest[0];

  if (!commandOrAction || commandOrAction === "help") {
    try {
      const actions = await gatewayOrError.gateway!.listToolkitActions(toolkit.apiSlug, toolkit.toolPrefix);
      return ok(renderToolkitGuide(toolkit, actions));
    } catch {
      return ok(renderToolkitGuide(toolkit));
    }
  }

  if (commandOrAction === "actions") {
    try {
      const actions = await gatewayOrError.gateway!.listToolkitActions(
        toolkit.apiSlug,
        toolkit.toolPrefix
      );
      return machineOutput ? ok(stringifyJson(actions)) : ok(renderActionList(toolkit, actions));
    } catch (error) {
      return failWithError(error);
    }
  }

  if (commandOrAction === "inspect") {
    const selector = rest[1];
    if (!selector) {
      return failWithError("Missing action name after 'inspect'.", {
        text: renderInputError("Missing action name after 'inspect'.", toolkit),
        toolkit,
      });
    }
    try {
      const actions = await gatewayOrError.gateway!.listToolkitActions(
        toolkit.apiSlug,
        toolkit.toolPrefix
      );
      const selection = resolveToolkitActionSelection(actions, selector);
      if (!selection.action) {
        return failWithError(`Unknown action '${selector}' for ${toolkit.displayName}.`, {
          text: renderUnknownAction(toolkit, selector, actions, selection.resolution?.value),
          toolkit,
          ...(selection.resolution?.value
            ? { suggestion: `Did you mean '${selection.resolution.value}'?` }
            : {}),
        });
      }
      const notice =
        selection.resolution?.kind === "auto"
          ? `Auto-corrected action '${selector}' to '${selection.action.cliName}'.\n\n`
          : "";
      return machineOutput
        ? ok(stringifyJson(selection.action))
        : ok(
            `${notice}${renderActionGuide(toolkit, selection.action, {
              allParameters: shared.display.allParameters,
            })}`
          );
    } catch (error) {
      return failWithError(error);
    }
  }

  try {
    const actions = await gatewayOrError.gateway!.listToolkitActions(toolkit.apiSlug, toolkit.toolPrefix);
    const selection = resolveToolkitActionSelection(actions, commandOrAction);
    if (!selection.action) {
      return failWithError(`Unknown action '${commandOrAction}' for ${toolkit.displayName}.`, {
        text: renderUnknownAction(toolkit, commandOrAction, actions, selection.resolution?.value),
        toolkit,
        ...(selection.resolution?.value
          ? { suggestion: `Did you mean '${selection.resolution.value}'?` }
          : {}),
      });
    }
    const action = selection.action;

    const actionTokens = rest.slice(1);
    if ((shared.display.idsOnly || shared.display.fields) && !hasSummaryDefault(toolkit, action)) {
      return failWithError(
        `Action '${action.cliName}' does not support --fields or --ids-only.`,
        {
          text: renderInputError(
            `Action '${action.cliName}' does not support --fields or --ids-only.`,
            toolkit,
            action
          ),
          toolkit,
          action: action.cliName,
        }
      );
    }
    if (shared.help) {
      const notice =
        selection.resolution?.kind === "auto"
          ? `Auto-corrected action '${commandOrAction}' to '${action.cliName}'.\n\n`
          : "";
      return ok(
        `${notice}${renderActionGuide(toolkit, action, {
          allParameters: shared.display.allParameters,
        })}`
      );
    }

    let input: Record<string, unknown>;
    try {
      input = buildActionInput({
        action,
        tokens: actionTokens,
        setExpressions: shared.setExpressions,
        ...(options.stdinText !== undefined ? { stdinText: options.stdinText } : {}),
        ...(shared.inputJson !== undefined ? { inputJson: shared.inputJson } : {}),
      });
    } catch (error) {
      return failWithError(error, {
        text: renderInputError(error instanceof Error ? error.message : String(error), toolkit, action),
        toolkit,
        action: action.cliName,
      });
    }

    const execution = await gatewayOrError.gateway!.executeAction(action, {
      userId: await getEffectiveUserId(),
      input,
      ...(shared.toolVersion !== undefined ? { toolVersion: shared.toolVersion } : {}),
    });

    if (machineOutput) {
      return ok(stringifyJson(execution));
    }
    const notice =
      selection.resolution?.kind === "auto"
        ? `Auto-corrected action '${commandOrAction}' to '${action.cliName}'.\n\n`
        : "";
    return ok(
      `${notice}${renderExecutionResult({
        toolkit,
        action,
        execution,
        display: shared.display,
      })}`
    );
  } catch (error) {
    return failWithError(error, {
      toolkit,
    });
  }
}

function createGatewayFactory(
  apiKey: string | undefined,
  baseUrl: string | undefined,
  options: CliRunOptions
): { gateway?: ComposioGateway; error?: string } {
  if (!apiKey) {
    return { error: renderMissingApiKey() };
  }

  const factory = options.gatewayFactory ?? createComposioGateway;
  return {
    gateway: factory({
      apiKey,
      ...(baseUrl !== undefined ? { baseUrl } : {}),
    }),
  };
}

async function resolvePackageVersion(): Promise<string> {
  try {
    const packageJsonUrl = new URL("../package.json", import.meta.url);
    const raw = await readFile(packageJsonUrl, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function ok(stdout: string): CliRunResult {
  return {
    exitCode: 0,
    stdout,
    stderr: "",
  };
}

function fail(stderr: string): CliRunResult {
  return {
    exitCode: 1,
    stdout: "",
    stderr,
  };
}

function failJson(stdout: string): CliRunResult {
  return {
    exitCode: 1,
    stdout,
    stderr: "",
  };
}
