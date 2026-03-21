import type { JsonSchemaProperty } from "../types.js";

export function parseJsonObject(raw: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON for ${label}: ${reason}`);
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return { ...parsed };
}

export function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value === undefined ? null : value, null, 2)}\n`;
}

export function coerceSchemaValue(raw: string, schema?: JsonSchemaProperty): unknown {
  if (!schema) {
    return inferPrimitive(raw);
  }

  const primaryType = firstType(schema);
  if (!primaryType) {
    return inferPrimitive(raw);
  }

  switch (primaryType) {
    case "boolean":
      if (raw === "true") {
        return true;
      }
      if (raw === "false") {
        return false;
      }
      throw new Error(`Expected a boolean value but received '${raw}'.`);
    case "integer": {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed) || String(parsed) !== raw.trim()) {
        throw new Error(`Expected an integer value but received '${raw}'.`);
      }
      return parsed;
    }
    case "number": {
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) {
        throw new Error(`Expected a number value but received '${raw}'.`);
      }
      return parsed;
    }
    case "object":
    case "array":
      return parseJsonValue(raw, `the ${primaryType} argument`);
    default:
      return raw;
  }
}

export function inferPrimitive(raw: string): unknown {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  if (raw === "null") {
    return null;
  }
  if (/^-?\d+$/.test(raw)) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (/^-?\d+\.\d+$/.test(raw)) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
    return parseJsonValue(raw, "the inline JSON value");
  }
  return raw;
}

export function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path
    .split(".")
    .flatMap(part => {
      const matches = [...part.matchAll(/([^[\]]+)|\[(\d+)\]/g)];
      return matches.map(match => match[1] ?? Number.parseInt(match[2]!, 10));
    });

  if (segments.length === 0) {
    throw new Error("The --set path cannot be empty.");
  }

  let cursor: unknown = target;
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const nextSegment = segments[index + 1];

    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) {
        throw new Error(`Cannot write to '${path}': '${segments[index - 1] ?? "root"}' is not an array.`);
      }
      if (isLast) {
        cursor[segment] = value;
        return;
      }
      if (cursor[segment] === undefined) {
        cursor[segment] = typeof nextSegment === "number" ? [] : {};
      }
      cursor = cursor[segment];
      return;
    }

    if (!isPlainObject(cursor)) {
      throw new Error(`Cannot write to '${path}': '${segment}' is nested under a non-object value.`);
    }
    if (isLast) {
      cursor[segment] = value;
      return;
    }
    if (cursor[segment] === undefined) {
      cursor[segment] = typeof nextSegment === "number" ? [] : {};
    }
    cursor = cursor[segment];
  });
}

function firstType(schema: JsonSchemaProperty): string | undefined {
  if (typeof schema.type === "string") {
    return schema.type;
  }
  if (Array.isArray(schema.type)) {
    return schema.type.find(type => type !== "null") ?? schema.type[0];
  }
  return undefined;
}

function parseJsonValue(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON for ${label}: ${reason}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
