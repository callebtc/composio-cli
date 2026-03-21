import { readFile } from "node:fs/promises";
import { API_KEY_ENV } from "./constants.js";
import { createComposioGateway } from "./composio/gateway.js";
import {
  renderActionGuide,
  renderActionList,
  renderConnections,
  renderDisabledToolkit,
  renderExecutionResult,
  renderInputError,
  renderMissingApiKey,
  renderRootHelp,
  renderRuntimeError,
  renderToolkitGuide,
  renderToolkitList,
  renderUnknownAction,
  renderUnknownToolkit,
  renderVersion,
} from "./help.js";
import { buildActionInput, parseSharedFlags } from "./input.js";
import { resolveToolkitAction } from "./toolkits/actions.js";
import { resolveToolkit, SUPPORTED_TOOLKITS } from "./toolkits/index.js";
import type { ToolkitDefinition } from "./toolkits/shared.js";
import type { CliRunOptions, CliRunResult, ComposioGateway } from "./types.js";
import { stringifyJson } from "./utils/json.js";

export async function runCli(argv: string[], options: CliRunOptions = {}): Promise<CliRunResult> {
  const env = options.env ?? process.env;
  const stdoutIsTTY = options.stdoutIsTTY ?? true;
  const shared = parseSharedFlags(argv);
  const machineOutput = shared.json || !stdoutIsTTY;
  const remaining = shared.remainingTokens;
  const gatewayOrError = createGatewayFactory(shared.apiKey ?? env[API_KEY_ENV], shared.baseUrl, options);

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
      toolkitSlugs: SUPPORTED_TOOLKITS.map(entry => entry.apiSlug),
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
      toolkitSlugs: SUPPORTED_TOOLKITS.map(entry => entry.apiSlug),
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
    const activeToolkits = new Set(accounts.map(account => account.toolkitSlug));
    enabledToolkitCache = SUPPORTED_TOOLKITS.filter(toolkit => activeToolkits.has(toolkit.apiSlug));
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
      return fail(renderMissingApiKey());
    }
    try {
      const enabledToolkits = await getEnabledToolkits();
      return machineOutput
        ? ok(stringifyJson(enabledToolkits))
        : ok(renderToolkitList(enabledToolkits, await getEffectiveUserId()));
    } catch (error) {
      return fail(renderRuntimeError(error instanceof Error ? error.message : String(error)));
    }
  }

  if (command === "connections") {
    if (gatewayOrError.error) {
      return fail(gatewayOrError.error);
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
      return fail(renderRuntimeError(error instanceof Error ? error.message : String(error)));
    }
  }

  const toolkit = resolveToolkit(command);
  if (!toolkit) {
    return fail(renderUnknownToolkit(command, await getEnabledToolkits().catch(() => [])));
  }

  if (gatewayOrError.error) {
    return fail(renderMissingApiKey());
  }

  const enabledToolkits = await getEnabledToolkits();
  const toolkitEnabled = enabledToolkits.some(entry => entry.apiSlug === toolkit.apiSlug);
  if (!toolkitEnabled) {
    return fail(renderDisabledToolkit(toolkit, await getEffectiveUserId(), enabledToolkits));
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
      return fail(renderRuntimeError(error instanceof Error ? error.message : String(error)));
    }
  }

  if (commandOrAction === "inspect") {
    const selector = rest[1];
    if (!selector) {
      return fail(renderInputError("Missing action name after 'inspect'.", toolkit));
    }
    try {
      const actions = await gatewayOrError.gateway!.listToolkitActions(
        toolkit.apiSlug,
        toolkit.toolPrefix
      );
      const action = resolveToolkitAction(actions, selector);
      if (!action) {
        return fail(renderUnknownAction(toolkit, selector, actions));
      }
      return machineOutput ? ok(stringifyJson(action)) : ok(renderActionGuide(toolkit, action));
    } catch (error) {
      return fail(renderRuntimeError(error instanceof Error ? error.message : String(error)));
    }
  }

  try {
    const actions = await gatewayOrError.gateway!.listToolkitActions(toolkit.apiSlug, toolkit.toolPrefix);
    const action = resolveToolkitAction(actions, commandOrAction);
    if (!action) {
      return fail(renderUnknownAction(toolkit, commandOrAction, actions));
    }

    const actionTokens = rest.slice(1);
    if (shared.help) {
      return ok(renderActionGuide(toolkit, action));
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
      return fail(
        renderInputError(
          error instanceof Error ? error.message : String(error),
          toolkit,
          action
        )
      );
    }

    const execution = await gatewayOrError.gateway!.executeAction(action, {
      userId: await getEffectiveUserId(),
      input,
      ...(shared.toolVersion !== undefined ? { toolVersion: shared.toolVersion } : {}),
    });

    if (machineOutput) {
      return ok(stringifyJson(execution));
    }
    return ok(renderExecutionResult({ toolkit, action, execution }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(renderRuntimeError(message));
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
