import type { JsonSchemaObject, JsonSchemaProperty, ToolkitAction } from "./types.js";
import { coerceSchemaValue, inferPrimitive, parseJsonObject, setAtPath } from "./utils/json.js";
import { normalizeToken } from "./utils/strings.js";

export interface SharedFlags {
  apiKey?: string | undefined;
  userId: string;
  userProvided: boolean;
  json: boolean;
  help: boolean;
  inputJson?: string | undefined;
  setExpressions: string[];
  toolVersion?: string | undefined;
  baseUrl?: string | undefined;
  remainingTokens: string[];
}

export function parseSharedFlags(argv: string[]): SharedFlags {
  const remainingTokens: string[] = [];
  const setExpressions: string[] = [];
  let apiKey: string | undefined;
  let userId = "default";
  let userProvided = false;
  let json = false;
  let help = false;
  let inputJson: string | undefined;
  let toolVersion: string | undefined;
  let baseUrl: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]!;
    const [flag, inlineValue] = splitInlineFlag(token);

    switch (flag) {
      case "--api-key":
        apiKey = expectValue(flag, inlineValue, argv[++index]);
        break;
      case "--user":
        userId = expectValue(flag, inlineValue, argv[++index]);
        userProvided = true;
        break;
      case "--input":
        inputJson = expectValue(flag, inlineValue, argv[++index]);
        break;
      case "--set":
        setExpressions.push(expectValue(flag, inlineValue, argv[++index]));
        break;
      case "--tool-version":
        toolVersion = expectValue(flag, inlineValue, argv[++index]);
        break;
      case "--base-url":
        baseUrl = expectValue(flag, inlineValue, argv[++index]);
        break;
      case "--json":
        json = true;
        break;
      case "--help":
      case "-h":
      case "help":
        help = true;
        break;
      default:
        remainingTokens.push(token);
        break;
    }
  }

  return {
    apiKey,
    userId,
    userProvided,
    json,
    help,
    inputJson,
    setExpressions,
    toolVersion,
    baseUrl,
    remainingTokens,
  };
}

export function buildActionInput(options: {
  action: ToolkitAction;
  tokens: string[];
  stdinText?: string | undefined;
  inputJson?: string | undefined;
  setExpressions: string[];
}): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const schema = options.action.inputSchema;

  if (options.stdinText && options.stdinText.trim().length > 0) {
    Object.assign(input, parseJsonObject(options.stdinText, "stdin"));
  }

  if (options.inputJson) {
    Object.assign(input, parseJsonObject(options.inputJson, "--input"));
  }

  const namedFlags = parseNamedFlags(options.tokens);
  const propertyLookup = buildPropertyLookup(schema);

  for (const entry of namedFlags) {
    const resolvedProperty = propertyLookup.get(normalizeToken(entry.name));
    const propertyName = resolvedProperty ?? entry.name;
    const propertySchema = schema?.properties?.[propertyName];
    input[propertyName] = coerceSchemaValue(entry.value, propertySchema);
  }

  for (const expression of options.setExpressions) {
    const separatorIndex = expression.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Invalid --set expression '${expression}'. Use key=value.`);
    }
    const path = expression.slice(0, separatorIndex);
    const rawValue = expression.slice(separatorIndex + 1);
    setAtPath(input, path, inferPrimitive(rawValue));
  }

  validateTopLevelRequiredFields(options.action, input);
  return input;
}

function parseNamedFlags(tokens: string[]): Array<{ name: string; value: string }> {
  const namedFlags: Array<{ name: string; value: string }> = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument '${token}'. Use --input JSON or named flags.`);
    }

    const [flag, inlineValue] = splitInlineFlag(token);
    const name = flag.slice(2);
    if (name.length === 0) {
      throw new Error("Encountered an empty flag name.");
    }

    if (inlineValue !== undefined) {
      namedFlags.push({ name, value: inlineValue });
      continue;
    }

    const next = tokens[index + 1];
    if (!next || next.startsWith("--")) {
      namedFlags.push({ name, value: "true" });
      continue;
    }

    namedFlags.push({ name, value: next });
    index += 1;
  }

  return namedFlags;
}

function buildPropertyLookup(schema?: JsonSchemaObject): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const key of Object.keys(schema?.properties ?? {})) {
    lookup.set(normalizeToken(key), key);
  }
  return lookup;
}

function validateTopLevelRequiredFields(action: ToolkitAction, input: Record<string, unknown>): void {
  const required = action.inputSchema?.required ?? [];
  const missing = required.filter(key => input[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
}

function expectValue(flag: string, inlineValue: string | undefined, nextValue: string | undefined): string {
  if (inlineValue !== undefined) {
    return inlineValue;
  }
  if (nextValue === undefined) {
    throw new Error(`${flag} expects a value.`);
  }
  return nextValue;
}

function splitInlineFlag(token: string): [string, string | undefined] {
  const separator = token.indexOf("=");
  if (separator === -1) {
    return [token, undefined];
  }
  return [token.slice(0, separator), token.slice(separator + 1)];
}
